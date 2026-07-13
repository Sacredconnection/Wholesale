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

const notConfigured = () =>
  Response.json({ error: "WooCommerce backend is not configured." }, { status: 503 });

// Payment instructions attached to every order as the customer-provided note.
const PAYMENT_NOTE = `H & F Bank Account:
Zelle: mslumiar@gmail.com
H&F Trading Company
Wells Fargo
Account: 6114240598
Routing numbers:
Direct deposits, electronic payments 121042882
Wire transfers – domestic 121000248
Swift Wells Fargo: WFBIUS6S
Wells Fargo Address: 420 Montgomery Street
Sao Francisco – California
Zip code: 94104
Address: H&F: 2301 Stampede Ave Cody WY 82414
– – – – –
Terms of Payment:
Net 30 days . Buyer shall pay all sales, use, customs, excise or other
taxes presently or hereafter payable in regards to this transaction, and
Buyer shall reimburse Seller for any such taxes or charges paid by
H&F Trading Company (hereafter "Seller.")
As importer no state excise tax is paid
No excise tax paid.
Shipment from USA`;

// Lists the orders belonging to a billing email (used by My Account).
export async function GET(request) {
  if (!isWooCommerceConfigured()) return notConfigured();

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return Response.json({ error: "Missing 'email' query parameter." }, { status: 400 });
  }

  try {
    const orders = await getOrdersByEmail(email);
    return Response.json({ orders: orders.map(mapOrder) });
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json({ error: "Failed to load orders from WooCommerce." }, { status });
  }
}

// Registers a wholesale order in WooCommerce. No online payment is taken:
// the order lands as "on-hold" and the team contacts the buyer to arrange it.
export async function POST(request) {
  if (!isWooCommerceConfigured()) return notConfigured();

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { customer = {}, items = [], note = "" } = body;

  if (!customer.email) {
    return Response.json({ error: "Missing customer email." }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "The order sheet is empty." }, { status: 400 });
  }

  try {
    // The buyer's access level (WP role) drives role-based pricing. Resolved
    // server-side from the customer record — never trusted from the client.
    const wcCustomer = await getCustomerByEmail(customer.email);
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
      const quantity = Math.max(1, parseInt(item.quantity) || 1);

      let payload = null; // full WC product or variation object
      let productId = null;
      let variationId = null;

      if (item.wcProductId && item.wcVariationId) {
        payload = await getVariationById(item.wcProductId, item.wcVariationId);
        productId = item.wcProductId;
        variationId = item.wcVariationId;
      } else if (item.wcProductId) {
        payload = await getProductById(item.wcProductId);
        productId = item.wcProductId;
      } else if (item.sku) {
        const found = await findProductBySku(item.sku);
        if (found) {
          payload = found;
          productId = found.parent_id || found.id;
          variationId = found.parent_id ? found.id : null;
        }
      }

      if (!payload) {
        unresolved.push(item.sku || item.name || "unknown item");
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
    const customerNote = note ? `${PAYMENT_NOTE}\n– – – – –\nBuyer note: ${note}` : PAYMENT_NOTE;

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
