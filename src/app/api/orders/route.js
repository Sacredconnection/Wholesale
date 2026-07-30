import {
  createOrder,
  findProductBySku,
  getCustomerByEmail,
  getOrdersByEmail,
  getProductById,
  getVariationById,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import {
  getMissingCommerceStores,
  getRequiredCommerceStores,
  PRIMARY_STORE_ID,
} from "@/lib/commerce-stores";
import {
  extractWeightGrams,
  isApprovedWholesaleCustomer,
  mapCustomerToUser,
  mapOrder,
  roleBasedPrices,
  toWcAddress,
} from "@/lib/wc-mappers";
import {
  MIN_ORDER_GRAMS,
  NEW_CUSTOMER_ROLE,
  progressivePerGramRate,
  progressiveTableKeyFor,
} from "@/lib/pricing";
import { createHash } from "node:crypto";
import {
  cleanText,
  isSameOrigin,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { isSupportedCountryCode } from "@/lib/countries";
import {
  completeIdempotency,
  enforceRateLimit,
  rateLimitIdentity,
  readIdempotencyKey,
  releaseIdempotency,
  reserveIdempotency,
} from "@/lib/abuse-protection";

const orderCustomerNote = () =>
  cleanText(
    (
      process.env.ORDER_CUSTOMER_NOTE ||
      "The Sacred Connection team will contact the buyer to arrange payment and shipping."
    ).replace(/\\n/g, "\n"),
    4_000,
    { multiline: true }
  );

const missingBackendsResponse = () => {
  const missingStores = getMissingCommerceStores();
  return missingStores.length > 0
    ? Response.json(
        {
          error: "The order service is temporarily unavailable.",
        },
        { status: 503 }
      )
    : null;
};

const orderErrorStatus = (err) =>
  err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;

const orderMetaValue = (order, key) => {
  const entries = order?.meta_data || [];
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    if (entries[index]?.key === key) return String(entries[index].value || "");
  }
  return "";
};

const sanitizedAddress = (address) => {
  if (!address || typeof address !== "object" || Array.isArray(address)) return null;
  return {
    street: cleanText(address.street, 160),
    neighborhood: cleanText(address.neighborhood, 160),
    city: cleanText(address.city, 100),
    state: cleanText(address.state, 100),
    zip: cleanText(address.zip, 24),
    country: cleanText(address.country, 2).toUpperCase(),
  };
};

const addressIsComplete = (address) =>
  Boolean(
    address?.street &&
      address.city &&
      address.zip &&
      isSupportedCountryCode(address.country)
  );

// Lists orders from both backends for My Account.
export async function GET(request) {
  const rateLimit = await enforceRateLimit(request, {
    namespace: "orders-read",
    limit: 60,
    windowSeconds: 60,
    identity: rateLimitIdentity(request),
  });
  if (rateLimit) return rateLimit;
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  const configurationError = missingBackendsResponse();
  if (configurationError) return configurationError;

  let stores;
  let results;
  try {
    const wcCustomer = await getCustomerByEmail(session.email, PRIMARY_STORE_ID);
    if (
      !isApprovedWholesaleCustomer(wcCustomer) ||
      wcCustomer.id !== session.customerId ||
      (wcCustomer.email || "").toLowerCase() !== session.email
    ) {
      return securityError("Authentication required.", 401);
    }
    stores = getRequiredCommerceStores();
    results = await Promise.allSettled(
      stores.map(async (store) => {
        const orders = await getOrdersByEmail(session.email, store.id);
        return orders.map((order) => mapOrder(order, store));
      })
    );
  } catch (error) {
    console.error("GET /api/orders failed while validating the customer:", error);
    return securityError("Failed to validate the account.", 502);
  }

  const orders = results
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ storeId: stores[index].id, storeName: stores[index].name }]
      : []
  );

  if (orders.length === 0 && failures.length === stores.length) {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`GET /api/orders failed for ${stores[index].id}:`, result.reason);
      }
    });
    return Response.json(
      { error: "We could not load your order history. Please try again." },
      { status: 502 }
    );
  }

  return Response.json(
    { orders, failures },
    { headers: { "Cache-Control": "no-store" } }
  );
}

// Creates one WooCommerce order per backend represented in the cart.
export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const ipLimit = await enforceRateLimit(request, {
    namespace: "orders-create-ip",
    limit: 20,
    windowSeconds: 10 * 60,
    identity: rateLimitIdentity(request),
  });
  if (ipLimit) return ipLimit;
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  const idempotencyKey = readIdempotencyKey(request);
  if (!idempotencyKey) {
    return securityError(
      "A valid Idempotency-Key header is required to create an order.",
      400
    );
  }
  const configurationError = missingBackendsResponse();
  if (configurationError) return configurationError;

  let body;
  let idempotencyHandle = null;
  let orderCreationStarted = false;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    if (err instanceof RequestBodyError) return securityError(err.message, err.status);
    return securityError("Invalid JSON body.", 400);
  }

  const { items = [] } = body;
  const checkout =
    body.checkout && typeof body.checkout === "object" && !Array.isArray(body.checkout)
      ? {
          firstName: cleanText(body.checkout.firstName, 80),
          lastName: cleanText(body.checkout.lastName, 80),
          company: cleanText(body.checkout.company, 160),
          phone: cleanText(body.checkout.phone, 40),
          shippingAddress: sanitizedAddress(body.checkout.shippingAddress),
          billingAddress: sanitizedAddress(body.checkout.billingAddress),
        }
      : null;
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return securityError("The order sheet must contain between 1 and 100 items.", 400);
  }
  if (
    body.checkout &&
    (!checkout ||
      !checkout.firstName ||
      !checkout.lastName ||
      !checkout.phone ||
      !addressIsComplete(checkout.shippingAddress) ||
      !addressIsComplete(checkout.billingAddress))
  ) {
    return securityError("Complete contact, shipping, and billing details are required.", 400);
  }

  try {
    // Authentication and buyer profile remain authoritative in Sacred Connection.
    const wcCustomer = await getCustomerByEmail(session.email, PRIMARY_STORE_ID);
    if (!isApprovedWholesaleCustomer(wcCustomer) || wcCustomer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }
    const customerLimit = await enforceRateLimit(request, {
      namespace: "orders-create-customer",
      limit: 10,
      windowSeconds: 10 * 60,
      identity: String(wcCustomer.id),
    });
    if (customerLimit) return customerLimit;
    const customer = mapCustomerToUser(wcCustomer);
    const role = wcCustomer.role || null;
    const stores = getRequiredCommerceStores();
    const storeById = new Map(stores.map((store) => [store.id, store]));

    const resolved = [];
    const unresolved = [];
    let totalWeightGrams = 0;
    const productCache = new Map();
    const getParentProduct = async (storeId, id) => {
      const key = `${storeId}:${id}`;
      if (!productCache.has(key)) {
        productCache.set(key, await getProductById(id, storeId));
      }
      return productCache.get(key);
    };
    const tableKeyFromCategories = (categories = []) =>
      categories.some((category) => progressiveTableKeyFor(category.name) === "shamanic")
        ? "shamanic"
        : "default";

    for (const item of items) {
      if (!item || typeof item !== "object") return securityError("Invalid order item.", 400);

      const storeId = cleanText(item.storeId, 64) || PRIMARY_STORE_ID;
      const store = storeById.get(storeId);
      if (!store) return securityError("Invalid product store.", 400);

      const quantity = Number(item.quantity);
      const requestedProductId = Number(item.wcProductId);
      const requestedVariationId = Number(item.wcVariationId);
      const sku = cleanText(item.sku, 100);
      if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) {
        return securityError("Every item quantity must be between 1 and 1000.", 400);
      }
      if (
        (item.wcProductId && (!Number.isSafeInteger(requestedProductId) || requestedProductId < 1)) ||
        (item.wcVariationId && (!Number.isSafeInteger(requestedVariationId) || requestedVariationId < 1))
      ) {
        return securityError("Invalid product identifier.", 400);
      }

      let payload = null;
      let productId = null;
      let variationId = null;
      if (requestedProductId && requestedVariationId) {
        payload = await getVariationById(requestedProductId, requestedVariationId, storeId);
        productId = requestedProductId;
        variationId = requestedVariationId;
      } else if (requestedProductId) {
        payload = await getProductById(requestedProductId, storeId);
        productId = requestedProductId;
      } else if (sku) {
        const found = await findProductBySku(sku, storeId);
        if (found) {
          payload = found;
          productId = found.parent_id || found.id;
          variationId = found.parent_id ? found.id : null;
        }
      }

      if (!payload) {
        unresolved.push(`${store.name}: ${sku || "unknown item"}`);
        continue;
      }

      const optionText =
        (payload.attributes || []).map((attribute) => attribute.option).filter(Boolean).join(" ") ||
        payload.name;
      const weightGrams = extractWeightGrams(optionText, payload.weight) || 0;
      totalWeightGrams += weightGrams * quantity;
      const categories = variationId
        ? (await getParentProduct(storeId, productId)).categories
        : payload.categories;

      resolved.push({
        store,
        productId,
        variationId,
        quantity,
        weightGrams,
        tableKey: tableKeyFromCategories(categories),
        rolePrice: role ? roleBasedPrices(payload.meta_data)[role] : undefined,
        basePrice: parseFloat(payload.price) || 0,
      });
    }

    if (unresolved.length > 0) {
      return Response.json(
        { error: `Some items were not found in their store catalogs: ${unresolved.join(", ")}.`, unresolved },
        { status: 422 }
      );
    }
    if (totalWeightGrams < MIN_ORDER_GRAMS) {
      return Response.json(
        {
          error: `Minimum wholesale order is ${MIN_ORDER_GRAMS}g; this order sheet totals ${Math.round(totalWeightGrams)}g.`,
        },
        { status: 422 }
      );
    }

    const isProgressive = role === NEW_CUSTOMER_ROLE;
    const entriesByStore = new Map();
    for (const entry of resolved) {
      if (!entriesByStore.has(entry.store.id)) entriesByStore.set(entry.store.id, []);
      entriesByStore.get(entry.store.id).push(entry);
    }

    const orderFirstName = checkout?.firstName || customer.firstName || "";
    const orderLastName = checkout?.lastName || customer.lastName || "";
    const orderCompany = checkout?.company || customer.company || "";
    const orderPhone = checkout?.phone || customer.phone || "";
    const orderBillingAddress = checkout?.billingAddress || customer.billingAddress;
    const orderShippingAddress = checkout?.shippingAddress || customer.shippingAddress;
    const billing = {
      first_name: orderFirstName,
      last_name: orderLastName,
      company: orderCompany,
      email: customer.email,
      phone: orderPhone,
      ...toWcAddress(orderBillingAddress),
    };
    const shipping = {
      first_name: orderFirstName,
      last_name: orderLastName,
      company: orderCompany,
      ...toWcAddress(orderShippingAddress),
    };

    const storesInOrder = stores.filter((store) => entriesByStore.has(store.id));
    const requestReference = createHash("sha256")
      .update(`${session.customerId}:${idempotencyKey}`)
      .digest("hex")
      .slice(0, 32);
    const reservation = await reserveIdempotency({
      namespace: "order-create",
      identity: `${session.customerId}:${session.email}`,
      key: idempotencyKey,
    });
    idempotencyHandle = reservation.handle;
    if (reservation.state === "completed") {
      return Response.json(reservation.completed.body, {
        status: reservation.completed.status,
        headers: {
          "Cache-Control": "no-store",
          "Idempotency-Replayed": "true",
        },
      });
    }
    if (reservation.state === "processing") {
      return Response.json(
        { error: "This order request is already being processed." },
        {
          status: 409,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": "5",
          },
        }
      );
    }

    orderCreationStarted = true;
    const creationResults = await Promise.allSettled(
      storesInOrder.map(async (store) => {
        const appliedRates = {};
        const lineItems = entriesByStore.get(store.id).map((entry) => {
          const rate = isProgressive
            ? progressivePerGramRate(totalWeightGrams, entry.tableKey)
            : null;
          const unitPrice =
            rate != null && entry.weightGrams > 0
              ? entry.weightGrams * rate
              : entry.rolePrice != null
                ? entry.rolePrice
                : entry.basePrice;
          if (rate != null && entry.weightGrams > 0) appliedRates[entry.tableKey] = rate;
          const lineTotal = (unitPrice * entry.quantity).toFixed(2);
          return {
            product_id: entry.productId,
            ...(entry.variationId ? { variation_id: entry.variationId } : {}),
            quantity: entry.quantity,
            subtotal: lineTotal,
            total: lineTotal,
          };
        });

        const orderPayload = {
          status: "on-hold",
          set_paid: false,
          customer_id: wcCustomer.id,
          payment_method: "sc_offline",
          payment_method_title: "Offline: Sacred Connection team will contact you to arrange payment",
          billing,
          shipping,
          line_items: lineItems,
          customer_note: orderCustomerNote(),
          meta_data: [
            { key: "sc_channel", value: "wholesale-portal" },
            { key: "sc_source_store", value: store.id },
            { key: "sc_request_reference", value: requestReference },
            { key: "sc_access_level", value: role || "none (base prices)" },
            { key: "sc_total_weight_grams", value: String(Math.round(totalWeightGrams)) },
            ...(Object.keys(appliedRates).length > 0
              ? [{
                  key: "sc_per_gram_rate",
                  value: Object.entries(appliedRates)
                    .map(([table, rate]) => `${table}: $${rate.toFixed(2)}/g`)
                    .join(" · "),
                }]
              : []),
            ...(customer.accountId
              ? [{ key: "sc_account_id", value: String(customer.accountId) }]
              : []),
            ...(customer.discountRate
              ? [{ key: "sc_discount_rate", value: String(customer.discountRate) }]
              : []),
          ],
        };

        try {
          const order = await createOrder(orderPayload, store.id);
          return mapOrder(order, store);
        } catch (creationError) {
          // WooCommerce can commit an order and then time out while returning
          // the response. Reconcile by the unique request marker before
          // reporting a failure or allowing another checkout attempt.
          try {
            const recentOrders = await getOrdersByEmail(customer.email, store.id);
            const recoveredOrder = recentOrders.find(
              (order) =>
                orderMetaValue(order, "sc_request_reference") === requestReference
            );
            if (recoveredOrder) {
              console.warn(
                `Recovered WooCommerce order ${recoveredOrder.id} after an uncertain create response.`
              );
              return mapOrder(recoveredOrder, store);
            }
          } catch (reconciliationError) {
            console.error(
              `Order reconciliation failed for ${store.id}:`,
              reconciliationError
            );
          }
          throw creationError;
        }
      })
    );

    const orders = creationResults.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : []
    );
    const failures = creationResults.flatMap((result, index) => {
      if (result.status === "fulfilled") return [];
      const store = storesInOrder[index];
      console.error(`POST /api/orders failed for ${store.id}:`, result.reason);
      return [{
        storeId: store.id,
        storeName: store.name,
        uncertain:
          !(result.reason instanceof WooCommerceApiError) ||
          result.reason.status >= 500,
      }];
    });

    if (orders.length === 0) {
      const uncertain = failures.some((failure) => failure.uncertain);
      const responseBody = {
        error: uncertain
          ? "We could not confirm the order response. Check My Account before submitting it again."
          : "We could not register your order. Please try again.",
        orders,
        failures,
        uncertain,
      };
      if (uncertain) {
        await completeIdempotency(idempotencyHandle, { status: 502, body: responseBody });
      } else {
        await releaseIdempotency(idempotencyHandle);
      }
      return Response.json(responseBody, {
        status: 502,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const status = failures.length > 0 ? 207 : 201;
    const responseBody = { orders, failures };
    await completeIdempotency(idempotencyHandle, { status, body: responseBody });
    return Response.json(responseBody, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    console.error("POST /api/orders failed before order creation:", err);
    const status = orderErrorStatus(err);
    const responseBody = { error: "We could not validate your order. Please try again." };
    if (idempotencyHandle) {
      if (orderCreationStarted) {
        await completeIdempotency(idempotencyHandle, { status, body: responseBody });
      } else {
        await releaseIdempotency(idempotencyHandle);
      }
    }
    return Response.json(responseBody, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
