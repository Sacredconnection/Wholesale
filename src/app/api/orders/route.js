import {
  createOrder,
  findProductBySku,
  getOrdersByEmail,
  isWooCommerceConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { mapOrder } from "@/lib/wc-mappers";

const notConfigured = () =>
  Response.json({ error: "WooCommerce backend is not configured." }, { status: 503 });

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

const toWcAddress = (address = {}) => ({
  address_1: address.street || "",
  address_2: address.neighborhood || "",
  city: address.city || "",
  state: address.state || "",
  postcode: address.zip || "",
  country: address.country || "",
});

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
    // Resolve each cart item to WooCommerce product/variation ids. Items added
    // from the live catalog carry the ids; otherwise fall back to SKU lookup.
    const lineItems = [];
    const unresolved = [];
    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      if (item.wcProductId) {
        lineItems.push({
          product_id: item.wcProductId,
          ...(item.wcVariationId ? { variation_id: item.wcVariationId } : {}),
          quantity,
        });
        continue;
      }
      const found = item.sku ? await findProductBySku(item.sku) : null;
      if (found) {
        lineItems.push(
          found.parent_id
            ? { product_id: found.parent_id, variation_id: found.id, quantity }
            : { product_id: found.id, quantity }
        );
      } else {
        unresolved.push(item.sku || item.name || "unknown item");
      }
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

    const noteLines = [
      "Wholesale order submitted via the B2B portal.",
      "No online payment taken — contact the buyer to arrange payment.",
    ];
    if (customer.discountRate) {
      noteLines.push(`Partner discount rate on file: ${customer.discountRate}%.`);
    }
    if (note) noteLines.push(`Buyer note: ${note}`);

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
      customer_note: noteLines.join("\n"),
      meta_data: [
        { key: "sc_channel", value: "wholesale-portal" },
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
