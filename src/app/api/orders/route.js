import {
  createOrder,
  findProductBySku,
  getCustomerByEmail,
  getOrdersByEmail,
  getProductById,
  getVariationById,
  isWooCommerceConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
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
import {
  cleanText,
  isSameOrigin,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";
import { getSession } from "@/lib/session";

const notConfigured = () =>
  Response.json({ error: "WooCommerce backend is not configured." }, { status: 503 });

// Payment instructions attached to every order as the customer-provided note.
const paymentInstructions = () =>
  cleanText(process.env.ORDER_PAYMENT_INSTRUCTIONS, 4000, { multiline: true });

// Lists the orders belonging to a billing email (used by My Account).
export async function GET() {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  if (!isWooCommerceConfigured()) return notConfigured();

  try {
    const orders = await getOrdersByEmail(session.email);
    return Response.json(
      { orders: orders.map(mapOrder) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json({ error: "Failed to load orders from WooCommerce." }, { status });
  }
}

// Registers a wholesale order in WooCommerce. No online payment is taken:
// the order lands as "on-hold" and the team contacts the buyer to arrange it.
export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  if (!isWooCommerceConfigured()) return notConfigured();

  let body;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    if (err instanceof RequestBodyError) return securityError(err.message, err.status);
    return securityError("Invalid JSON body.", 400);
  }

  const { items = [] } = body;
  const note = cleanText(body.note, 1000, { multiline: true });
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    return securityError("The order sheet must contain between 1 and 100 items.", 400);
  }

  try {
    // The buyer's access level (WP role) drives role-based pricing. Resolved
    // server-side from the customer record — never trusted from the client.
    const wcCustomer = await getCustomerByEmail(session.email);
    if (!isApprovedWholesaleCustomer(wcCustomer) || wcCustomer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }
    const customer = mapCustomerToUser(wcCustomer);
    const role = wcCustomer?.role || null;

    // Phase 1 — resolve each cart item to its WooCommerce payload so price
    // (per access level) and weight are authoritative. Items from the live
    // catalog carry ids; otherwise fall back to SKU lookup.
    const resolved = [];
    const unresolved = [];
    let totalWeightGrams = 0;

    // Parent products fetched once per request (variations don't carry the
    // categories that pick the progressive tier table).
    const productCache = new Map();
    const getParentProduct = async (id) => {
      if (!productCache.has(id)) productCache.set(id, await getProductById(id));
      return productCache.get(id);
    };
    const tableKeyFromCategories = (categories = []) =>
      categories.some((c) => progressiveTableKeyFor(c.name) === "shamanic")
        ? "shamanic"
        : "default";

    for (const item of items) {
      if (!item || typeof item !== "object") return securityError("Invalid order item.", 400);

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

      let payload = null; // full WC product or variation object
      let productId = null;
      let variationId = null;

      if (requestedProductId && requestedVariationId) {
        payload = await getVariationById(requestedProductId, requestedVariationId);
        productId = requestedProductId;
        variationId = requestedVariationId;
      } else if (requestedProductId) {
        payload = await getProductById(requestedProductId);
        productId = requestedProductId;
      } else if (sku) {
        const found = await findProductBySku(sku);
        if (found) {
          payload = found;
          productId = found.parent_id || found.id;
          variationId = found.parent_id ? found.id : null;
        }
      }

      if (!payload) {
        unresolved.push(sku || "unknown item");
        continue;
      }

      const optionText =
        (payload.attributes || [])
          .map((a) => a.option)
          .filter(Boolean)
          .join(" ") || payload.name;
      const weightGrams = extractWeightGrams(optionText, payload.weight) || 0;
      totalWeightGrams += weightGrams * quantity;

      // Categories live on the parent product, not the variation
      const categories = variationId
        ? (await getParentProduct(productId)).categories
        : payload.categories;

      resolved.push({
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
        {
          error: `Some items were not found in the store catalog: ${unresolved.join(", ")}.`,
          unresolved,
        },
        { status: 422 }
      );
    }

    if (totalWeightGrams < MIN_ORDER_GRAMS) {
      return Response.json(
        {
          error: `Minimum wholesale order is ${MIN_ORDER_GRAMS}g — this order sheet totals ${Math.round(totalWeightGrams)}g.`,
        },
        { status: 422 }
      );
    }

    // Phase 2 — price each line. New Customer gets progressive per-gram
    // pricing: the tier is set by the TOTAL order weight, the rate comes from
    // each item's own table (indigenous vs shamanic). Other levels use their
    // flat role prices (falling back to the catalog base price).
    const isProgressive = role === NEW_CUSTOMER_ROLE;
    const appliedRates = {}; // tableKey → rate, recorded in order meta

    const lineItems = resolved.map((entry) => {
      let unitPrice;
      const rate = isProgressive
        ? progressivePerGramRate(totalWeightGrams, entry.tableKey)
        : null;
      if (rate != null && entry.weightGrams > 0) {
        unitPrice = entry.weightGrams * rate;
        appliedRates[entry.tableKey] = rate;
      } else {
        unitPrice = entry.rolePrice != null ? entry.rolePrice : entry.basePrice;
      }
      const lineTotal = (unitPrice * entry.quantity).toFixed(2);

      return {
        product_id: entry.productId,
        ...(entry.variationId ? { variation_id: entry.variationId } : {}),
        quantity: entry.quantity,
        // Explicit totals so the order reflects the buyer's access-level
        // pricing (the role-pricing plugin only hooks the WP storefront cart).
        subtotal: lineTotal,
        total: lineTotal,
      };
    });

    // Customer-facing note: payment instructions on every order, plus any
    // note the buyer typed. Internal context goes to meta_data instead.
    const instructions = paymentInstructions();
    const customerNote = [instructions, note ? `Buyer note: ${note}` : ""]
      .filter(Boolean)
      .join("\n---\n");

    const order = await createOrder({
      status: "on-hold",
      set_paid: false,
      payment_method: "sc_offline",
      payment_method_title: "Offline — Sacred Connection team will contact you to arrange payment",
      billing: {
        first_name: customer.firstName || "",
        last_name: customer.lastName || "",
        company: customer.company || "",
        email: customer.email,
        phone: customer.phone || "",
        ...toWcAddress(customer.billingAddress),
      },
      shipping: {
        first_name: customer.firstName || "",
        last_name: customer.lastName || "",
        company: customer.company || "",
        ...toWcAddress(customer.shippingAddress),
      },
      line_items: lineItems,
      customer_note: customerNote,
      meta_data: [
        { key: "sc_channel", value: "wholesale-portal" },
        { key: "sc_access_level", value: role || "none (base prices)" },
        { key: "sc_total_weight_grams", value: String(Math.round(totalWeightGrams)) },
        ...(Object.keys(appliedRates).length > 0
          ? [
              {
                key: "sc_per_gram_rate",
                value: Object.entries(appliedRates)
                  .map(([table, rate]) => `${table}: $${rate.toFixed(2)}/g`)
                  .join(" · "),
              },
            ]
          : []),
        ...(customer.accountId ? [{ key: "sc_account_id", value: String(customer.accountId) }] : []),
        ...(customer.discountRate
          ? [{ key: "sc_discount_rate", value: String(customer.discountRate) }]
          : []),
      ],
    });

    return Response.json({ order: mapOrder(order) }, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders failed:", err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json({ error: "Failed to register the order in WooCommerce." }, { status });
  }
}
