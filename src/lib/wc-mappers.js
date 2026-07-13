// Maps WooCommerce REST payloads to the internal product shape the UI already
// uses (same fields as src/data/products.js), so pages work identically with
// static or live data.

const stripHtml = (html) =>
  (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Reads the first option of a product attribute by name (case-insensitive).
// Product attributes carry `options` (array); variation attributes carry `option`.
const attributeOption = (attributes, name) => {
  const attr = (attributes || []).find(
    (a) => (a.name || "").toLowerCase() === name.toLowerCase()
  );
  if (!attr) return null;
  if (Array.isArray(attr.options)) return attr.options[0] || null;
  return attr.option || null;
};

export function mapVariationToOption(variation) {
  const name =
    (variation.attributes || [])
      .map((a) => a.option)
      .filter(Boolean)
      .join(" / ") || variation.sku;

  return {
    name,
    price: parseFloat(variation.price) || 0,
    sku: variation.sku || String(variation.id),
    // Assumes the store's weight unit is grams (WooCommerce > Settings > Products).
    weightGrams: parseFloat(variation.weight) || null,
    wcVariationId: variation.id,
  };
}

// Light order shape sent to the client (never expose the raw WC payload).
export function mapOrder(order) {
  return {
    id: order.id,
    number: order.number,
    status: order.status,
    dateCreated: order.date_created,
    total: order.total,
    currency: order.currency,
    paymentMethodTitle: order.payment_method_title,
    customerNote: order.customer_note,
    items: (order.line_items || []).map((li) => ({
      name: li.name,
      sku: li.sku,
      quantity: li.quantity,
      total: li.total,
    })),
  };
}

export function mapProduct(product, variations = []) {
  const options =
    product.type === "variable" && variations.length > 0
      ? variations.filter((v) => v.purchasable !== false).map(mapVariationToOption)
      : [
          {
            name: "Default",
            price: parseFloat(product.price) || 0,
            sku: product.sku || String(product.id),
            weightGrams: parseFloat(product.weight) || null,
            wcVariationId: null,
          },
        ];

  return {
    // The slug doubles as the route param (/product/[id]) — keep WP slugs
    // aligned with the ids in src/data/products.js for stable URLs.
    id: product.slug,
    wcId: product.id,
    name: product.name,
    sku: product.sku || String(product.id),
    category: product.categories?.[0]?.name || "Uncategorized",
    tribe: attributeOption(product.attributes, "tribe") || product.tags?.[0]?.name || "",
    image: product.images?.[0]?.src || null,
    images: (product.images || []).map((img) => img.src),
    description: stripHtml(product.short_description) || stripHtml(product.description),
    isNew: product.featured === true || (product.tags || []).some((t) => t.slug === "new"),
    options,
  };
}
