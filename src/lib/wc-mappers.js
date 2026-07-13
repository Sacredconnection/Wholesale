// Maps WooCommerce REST payloads to the internal product shape used by the UI.

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

// "28gr" → 28, "7.1gr" → 7.1, "1kg" → 1000
const parseGramsFromText = (text) => {
  const m = /([\d.,]+)\s*(kg|gr?|g)\b/i.exec(text || "");
  if (!m) return null;
  const n = parseFloat(m[1].replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return /kg/i.test(m[2]) ? n * 1000 : n;
};

// The store's weight unit is configurable; this backend uses kg (e.g. "0.028"
// for a 28g pouch). Values under 5 are treated as kg, otherwise as grams.
const weightFieldToGrams = (weight) => {
  const n = parseFloat(weight);
  if (!n) return null;
  return n < 5 ? n * 1000 : n;
};

export const extractWeightGrams = (nameText, weightField) =>
  parseGramsFromText(nameText) ?? weightFieldToGrams(weightField);

// Reads the "Role Based Pricing" plugin rules from meta_data and resolves the
// effective flat price per access level, e.g. { "Special Customer": 200 }.
// Levels without a resolvable flat price are omitted (fall back to base price).
export function roleBasedPrices(metaData = []) {
  const rules = metaData.find((m) => m.key === "_role_based_pricing_rules")?.value;
  if (!rules || typeof rules !== "object") return {};

  const prices = {};
  for (const [role, rule] of Object.entries(rules)) {
    if (!rule || rule.pricing_type !== "flat") continue;
    const price = parseFloat(rule.sale_price ?? rule.regular_price);
    if (Number.isFinite(price)) prices[role] = price;
  }
  return prices;
}

export function mapVariationToOption(variation) {
  const name =
    (variation.attributes || [])
      .map((a) => a.option)
      .filter(Boolean)
      .join(" / ") || variation.sku;

  return {
    name,
    price: parseFloat(variation.price) || 0,
    rolePrices: roleBasedPrices(variation.meta_data),
    sku: variation.sku || String(variation.id),
    weightGrams: extractWeightGrams(name, variation.weight),
    wcVariationId: variation.id,
  };
}

const normalizeName = (str) =>
  (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Pre-computes category hierarchy info used by mapProduct: which categories
// are subcategories (their names double as the tribe list, e.g. "Huni Kuin"
// under "Rapé Indigenous").
export function buildCategoryContext(categories = []) {
  const parentById = {};
  const nameById = {};
  categories.forEach((c) => {
    parentById[c.id] = c.parent || 0;
    nameById[c.id] = c.name;
  });
  const childNames = categories.filter((c) => c.parent).map((c) => c.name);
  return { parentById, nameById, childNames };
}

// Walks up the category tree to the top-level ancestor (e.g. "Yawanawa" →
// "Rapé Indigenous"). Depth-capped in case of malformed hierarchies.
const topLevelCategoryName = (categoryId, parentById, nameById) => {
  let id = categoryId;
  for (let depth = 0; depth < 10 && parentById[id]; depth++) {
    id = parentById[id];
  }
  return nameById[id] || null;
};

// Internal address shape ↔ WooCommerce address shape
export const toWcAddress = (address = {}) => ({
  address_1: address.street || "",
  address_2: address.neighborhood || "",
  city: address.city || "",
  state: address.state || "",
  postcode: address.zip || "",
  country: address.country || "",
});

export const fromWcAddress = (address = {}) => ({
  street: address.address_1 || "",
  neighborhood: address.address_2 || "",
  city: address.city || "",
  state: address.state || "",
  zip: address.postcode || "",
  country: address.country || "",
});

const customerMeta = (customer, key) =>
  (customer.meta_data || []).find((m) => m.key === key)?.value;

// Maps a WooCommerce customer to the user shape the UI stores in AuthContext.
// Wholesale terms (credit limit / discount) live in customer meta so the team
// can manage them from WP Admin; they default to 0 when absent.
export function mapCustomerToUser(customer) {
  return {
    firstName: customer.first_name || "",
    lastName: customer.last_name || "",
    displayName:
      [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
      customer.username ||
      customer.email,
    email: customer.email,
    company: customer.billing?.company || "",
    phone: customer.billing?.phone || "",
    country: customer.billing?.country || customer.shipping?.country || "",
    accountId: `SC-WC-${customer.id}`,
    wcCustomerId: customer.id,
    // Access level (WP role) — drives role-based pricing, e.g. "New Customer",
    // "Special Customer", "Old Customer".
    role: customer.role || null,
    status: ["pending", "customer"].includes((customer.role || "").toLowerCase())
      ? "PENDING"
      : "ACTIVE",
    creditLimit: Number(customerMeta(customer, "sc_credit_limit")) || 0,
    discountRate: Number(customerMeta(customer, "sc_discount_rate")) || 0,
    avatar: customer.avatar_url || null,
    isAdmin: customer.role === "administrator",
    shippingAddress: fromWcAddress(customer.shipping),
    billingAddress: fromWcAddress(customer.billing),
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

export function mapProduct(product, variations = [], categoryContext = {}) {
  const { parentById = {}, nameById = {}, childNames = [] } = categoryContext;

  const options =
    product.type === "variable" && variations.length > 0
      ? variations
          .filter((v) => v.purchasable !== false)
          .map(mapVariationToOption)
          .sort((a, b) => (a.weightGrams ?? Infinity) - (b.weightGrams ?? Infinity))
      : [
          {
            name: parseGramsFromText(product.name) ? `${parseGramsFromText(product.name)}g` : "Default",
            price: parseFloat(product.price) || 0,
            rolePrices: roleBasedPrices(product.meta_data),
            sku: product.sku || String(product.id),
            weightGrams: extractWeightGrams(product.name, product.weight),
            wcVariationId: null,
          },
        ];

  // Category hierarchy: top-level categories ("Rapé Indigenous", "Sacred
  // Connection") are the product category; subcategories are the tribe.
  const cats = product.categories || [];
  const topCats = cats.filter((c) => !parentById[c.id]);
  const subCats = cats.filter((c) => parentById[c.id]);

  const tribe =
    attributeOption(product.attributes, "tribe") ||
    subCats[0]?.name ||
    // Fall back to detecting a known subcategory name inside the product name
    // (e.g. "SHAWADAWA KAPAYUBA HAPE" → "Shawãdawa").
    childNames.find((n) => normalizeName(product.name).includes(normalizeName(n))) ||
    topCats[0]?.name ||
    "";

  return {
    // The slug doubles as the route param (/product/[id])
    id: product.slug,
    wcId: product.id,
    name: product.name,
    sku: product.sku || String(product.id),
    category:
      topCats[0]?.name ||
      (subCats[0] && topLevelCategoryName(subCats[0].id, parentById, nameById)) ||
      cats[0]?.name ||
      "Uncategorized",
    tribe,
    image: product.images?.[0]?.src || null,
    images: (product.images || []).map((img) => img.src),
    description: stripHtml(product.short_description) || stripHtml(product.description),
    isNew: product.featured === true || (product.tags || []).some((t) => t.slug === "new"),
    options,
  };
}
