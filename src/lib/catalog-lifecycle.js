import { isOptionVisible, orderableStockQuantity } from "@/lib/pricing";

const normalize = (value) => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  .replace(/\bcaboclos\b/g, "caboclo");

const TRIBES = ["apurina", "caboclo", "katukina", "huni kuin", "kuntanawa", "nukini", "puyanawa", "shanenawa", "shawadawa", "yawanawa"];
const PHASE_OUT = {
  caboclo: ["amazon green"],
  "huni kuin": ["emburana", "iban", "mulateiro", "tradition", "uxi", "tsunu"],
  kuntanawa: ["aia", "canela de velho", "copaiba", "jatoba", "kapaxamba", "samauma flower"],
  yawanawa: ["pai nani", "waxy"],
};
const REMOVE = { katukina: ["caneleiro", "tsunu"], yawanawa: ["chief"] };
const MADE_TO_ORDER = { "huni kuin": ["cumaru de cheiro"], nukini: ["cravinho"] };
// Starred entries from the corrections PDF, matched uniquely in the read-only
// WooCommerce audit on 2026-10-13. Require both listing ID and exact origin/name.
const VERIFIED_LISTINGS = new Map([
  [3340, { tribe: "caboclo", variety: "cumaru trevo", lifecycle: "phase-out" }],
  [3372, { tribe: "caboclo", variety: "samauma croa", lifecycle: "phase-out" }],
  [5757, { tribe: "yawanawa", variety: "runu", lifecycle: "phase-out" }],
  [3249, { tribe: "huni kuin", variety: "capemba", lifecycle: "made-to-order" }],
]);

// Match a whole variety within a confirmed tribe. Similar names, aliases and
// unverified review/asterisk entries deliberately do not match.
export function productLifecycle(product = {}) {
  const attributes = (product.attributes || []).flatMap((attribute) =>
    normalize(attribute.name).replace(/^pa /, "") === "tribe"
      ? attribute.options || [attribute.option || attribute.value] : []);
  const categories = (product.categories || []).map((category) => category.name);
  const labels = [product.tribe, product.category, ...attributes, ...categories].map(normalize);
  const tribes = TRIBES.filter((tribe) => labels.some((label) => label === tribe));
  const excluded = labels.some((label) => /\b(accessor\w*|kuripe\w*|tepi\w*|container\w*|bottle\w*|mapacho|ashes|ash|incense|resin|sananga)\b/.test(label));
  const isHape = !excluded && (labels.some((label) => /\b(hape|rapeh|rape|indigenous|sacred connection|shamanic)\b/.test(label)) || tribes.length === 1 ||
    /\b(hape|rapeh|rape)\b/.test(normalize(product.name)));
  const tribe = tribes.length === 1 ? tribes[0] : "";
  let variety = normalize(product.name).replace(/\b(hape|rapeh|rape)\b/g, " ")
    .replace(/\b\d+(?:\s\d+)?\s*(g|gr|grams|kg)\b/g, " ");
  if (tribe) variety = variety.replace(new RegExp(`(^| )${tribe}(?= |$)`, "g"), " ");
  variety = variety.replace(/\s+/g, " ").trim();
  const verified = VERIFIED_LISTINGS.get(Number(product.wcId || product.id));
  const verifiedLifecycle = verified?.tribe === tribe && verified.variety === variety
    ? verified.lifecycle : null;
  const lifecycle = !isHape ? "active" : verifiedLifecycle || (REMOVE[tribe]?.includes(variety) ? "removed"
    : PHASE_OUT[tribe]?.includes(variety) ? "phase-out"
      : MADE_TO_ORDER[tribe]?.includes(variety) ? "made-to-order" : "active");
  return { lifecycle, isHape };
}

export function applyOptionLifecycle(option, policy) {
  const stockLimited = policy.lifecycle === "phase-out" ||
    (policy.isHape && [5, 100, 500].includes(Number(option.weightGrams)));
  const decorated = { ...option, lifecycle: policy.lifecycle, stockLimited };
  const stock = orderableStockQuantity(decorated);
  const unavailable = decorated.inStock === false || stock === 0;
  return {
    ...decorated,
    availabilityLabel: policy.lifecycle === "removed" ? "No longer available"
      : stockLimited ? stock == null ? "Stock confirmation required" : unavailable ? "Temporarily out of stock" : "In stock"
        : unavailable && policy.lifecycle === "made-to-order" ? "Made to order"
          : unavailable ? "Temporarily out of stock — available to order" : "In stock",
  };
}

export function applyProductLifecycle(product, source = product) {
  const policy = productLifecycle(source);
  const varietyHasStock = (product.options || []).some((option) =>
    option.inStock !== false && (orderableStockQuantity(option) == null || orderableStockQuantity(option) > 0));
  const allOptions = (product.options || []).map((option) => {
    const decorated = applyOptionLifecycle(option, policy);
    return decorated.availabilityLabel === "Made to order" && varietyHasStock
      ? { ...decorated, availabilityLabel: "Temporarily out of stock — available to order" }
      : decorated;
  });
  const options = allOptions.filter(isOptionVisible);
  return {
    ...product,
    lifecycle: policy.lifecycle,
    isHape: policy.isHape,
    availabilityLabel: options.length > 0 && options.every((option) => option.stockLimited && orderableStockQuantity(option) == null)
      ? "Stock confirmation required"
      : varietyHasStock ? "In stock"
        : policy.lifecycle === "made-to-order" ? "Made to order" : "Temporarily out of stock",
    options,
    hiddenOptionSkus: allOptions.filter((option) => !isOptionVisible(option)).map((option) => option.sku),
    catalogVisible: policy.lifecycle !== "removed" &&
      (options.length > 0 || (!product.optionsLoaded && policy.lifecycle !== "phase-out")),
    inStock: options.some((option) => option.inStock !== false),
  };
}
