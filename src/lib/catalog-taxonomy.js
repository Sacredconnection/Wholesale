// Presentation taxonomy only. Keep WooCommerce category values intact for pricing.
export const MAIN_CATEGORIES = [
  "Indigenous Hapé",
  "Sacred Connection Hapé",
  "Accessories",
  "Mapacho",
  "Other Products",
];

export const normalizeCatalogText = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const INDIGENOUS_NAMES = [
  "apurina", "caboclo", "caboclos", "huni kuin", "kaxinawa", "katukina", "kuntanawa",
  "nukini", "puyanawa", "shanenawa", "shawadawa", "shawandawa", "yawanawa", "yawanaua",
];
const hasWord = (value, word) => ` ${value} `.includes(` ${word} `);

export function getCatalogTaxonomy(product = {}) {
  const category = String(product.category || "").trim();
  const tribe = String(product.tribe || "").trim();
  const normalizedCategory = normalizeCatalogText(category);
  const normalizedTribe = normalizeCatalogText(tribe);
  const facets = `${normalizedCategory} ${normalizedTribe}`;
  const subcategory = tribe && normalizedTribe !== normalizedCategory ? tribe : category;

  // Classify non-Hapé groups first: a tribe can also make an accessory or ash.
  if (/\b(mapacho)\b/.test(facets)) {
    return { mainCategory: "Mapacho", subcategory: normalizedTribe !== "mapacho" && tribe ? tribe : "Mapacho" };
  }
  if (/\b(accessor\w*|kuripe|tepi|container\w*|bottle\w*|jar\w*)\b/.test(facets)) {
    const type = /\bkuripe\b/.test(facets) ? "Kuripe"
      : /\btepi\b/.test(facets) ? "Tepi"
        : /\b(container\w*|bottle\w*|jar\w*)\b/.test(facets) ? "Containers"
          : subcategory || "Accessories";
    return { mainCategory: "Accessories", subcategory: type };
  }
  if (/\b(ashes|ash|incense|resin|sananga)\b/.test(normalizedCategory)) {
    return { mainCategory: "Other Products", subcategory: category || "Other Products" };
  }
  if (/\b(sacred connection|shamanic)\b/.test(facets)) {
    return { mainCategory: "Sacred Connection Hapé", subcategory: subcategory || "Blends" };
  }
  if (/\bindigenous\b/.test(facets) || INDIGENOUS_NAMES.some((name) => hasWord(facets, name))) {
    return { mainCategory: "Indigenous Hapé", subcategory: tribe || category || "Indigenous Hapé" };
  }
  return { mainCategory: "Other Products", subcategory: subcategory || "Other Products" };
}

export function compareCatalogProducts(left, right) {
  const a = getCatalogTaxonomy(left);
  const b = getCatalogTaxonomy(right);
  return MAIN_CATEGORIES.indexOf(a.mainCategory) - MAIN_CATEGORIES.indexOf(b.mainCategory)
    || normalizeCatalogText(a.subcategory).localeCompare(normalizeCatalogText(b.subcategory))
    || normalizeCatalogText(left.name).localeCompare(normalizeCatalogText(right.name));
}

export function groupCatalogProducts(products = []) {
  const groups = new Map();
  [...products].sort(compareCatalogProducts).forEach((product) => {
    const { mainCategory, subcategory } = getCatalogTaxonomy(product);
    if (!groups.has(mainCategory)) groups.set(mainCategory, new Map());
    const children = groups.get(mainCategory);
    if (!children.has(subcategory)) children.set(subcategory, []);
    children.get(subcategory).push(product);
  });
  return [...groups].map(([name, children]) => ({
    name,
    subcategories: [...children].map(([name, products]) => ({ name, products })),
  }));
}

export function catalogProductTitle(product = {}) {
  // Origin remains visible in the surrounding category/subcategory heading.
  const original = String(product.name || "Product");
  let title = original
    .replace(/^(?:(?:Sacred Connection|Wholesale)\s*[-–—:|]\s*)+/i, "")
    .replace(/^(?:Hap[eé]|Rap[eé])\s*[-–—:|]\s*/i, "")
    .trim();
  const originNames = new Set([product.category, product.tribe].filter(Boolean).map(normalizeCatalogText));
  const prefix = /^(.+?)\s*[-–—:|]\s*(.+)$/.exec(title);
  if (prefix && originNames.has(normalizeCatalogText(prefix[1]))) title = prefix[2].trim();
  if (product.isHape || getCatalogTaxonomy(product).mainCategory.endsWith("Hapé")) {
    title = title.replace(/\s+(?:Rap[eé]h?|Hap[eé])$/i, "").trim();
  }
  return title || original;
}
