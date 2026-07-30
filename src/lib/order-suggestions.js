import { MIN_ORDER_GRAMS } from "@/lib/pricing";

export const SUGGESTED_BLEND_RECIPES = [
  {
    id: "balanced-counter",
    title: "Balanced Counter Mix",
    eyebrow: "Broad assortment",
    description:
      "A varied shelf-ready order designed to give returning customers several familiar directions to explore.",
    terms: [],
    preferredWeight: 100,
  },
  {
    id: "yawanawa-lineage",
    title: "Yawanawá Lineage",
    eyebrow: "Single-nation focus",
    description:
      "A focused assortment built only from products explicitly associated with the Yawanawá nation.",
    terms: ["yawanawa"],
    preferredWeight: 50,
    strict: true,
  },
  {
    id: "mixed-indigenous-nations",
    title: "Mixed Indigenous Nations",
    eyebrow: "Cross-lineage assortment",
    description:
      "A varied selection across distinct indigenous nations, with lineage diversity prioritized.",
    terms: ["indigenous"],
    preferredWeight: 50,
    strict: true,
  },
  {
    id: "tobacco-free",
    title: "Tobacco-Free Discovery",
    eyebrow: "Alternative assortment",
    description:
      "A focused mix containing only products explicitly classified as tobacco-free in the live catalog.",
    terms: ["tobacco free", "tobacco-free", "tobaccofree"],
    preferredWeight: 100,
    strict: true,
  },
  {
    id: "traditional-heritage",
    title: "Traditional Heritage",
    eyebrow: "Classic assortment",
    description:
      "A traditional-facing selection spanning classic, ash, and Sacred Connection catalog groups.",
    terms: ["traditional", "ash", "tobacco", "sacred connection"],
    preferredWeight: 100,
  },
];

export const normalizeSuggestionText = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const productSearchText = (product) =>
  normalizeSuggestionText(
    [
      product?.name,
      product?.category,
      product?.tribe,
      ...(product?.attributes || []).flatMap((attribute) => [
        attribute.name,
        ...(attribute.values || []),
      ]),
    ]
      .filter(Boolean)
      .join(" ")
  );

export const recipeScore = (product, recipe) => {
  if (!recipe.terms.length) {
    return product?.isNew ? 2 : 1;
  }
  const haystack = productSearchText(product);
  return recipe.terms.reduce(
    (score, term) => score + (haystack.includes(normalizeSuggestionText(term)) ? 3 : 0),
    0
  );
};

export const isStockedOption = (option) =>
  Boolean(
    option &&
      option.inStock !== false &&
      (!option.stockStatus || option.stockStatus === "instock") &&
      (option.stockQuantity == null || Number(option.stockQuantity) > 0)
  );

export const findCatalogProduct = (products, item, storeId) => {
  const sameStore = (product) =>
    (product.storeId || "sacred-connection") === (storeId || "sacred-connection");
  const productId = Number(item?.productId);
  if (Number.isSafeInteger(productId) && productId > 0) {
    const byId = products.find(
      (product) => sameStore(product) && Number(product.wcId) === productId
    );
    if (byId) return byId;
  }

  const sku = normalizeSuggestionText(item?.sku);
  return sku
    ? products.find(
        (product) =>
          sameStore(product) &&
          (normalizeSuggestionText(product.sku) === sku ||
            product.options?.some(
              (option) => normalizeSuggestionText(option.sku) === sku
            ))
      )
    : null;
};

export const findOptionIndex = (product, item) => {
  const variationId = Number(item?.variationId);
  if (Number.isSafeInteger(variationId) && variationId > 0) {
    const byId = product.options?.findIndex(
      (option) => Number(option.wcVariationId) === variationId
    );
    if (byId >= 0) return byId;
  }

  const sku = normalizeSuggestionText(item?.sku);
  if (sku) {
    const bySku = product.options?.findIndex(
      (option) => normalizeSuggestionText(option.sku) === sku
    );
    if (bySku >= 0) return bySku;
  }
  return -1;
};

export const preferredStockedOptionIndex = (product, preferredWeight = 100) => {
  const candidates = (product.options || [])
    .map((option, optionIndex) => ({ option, optionIndex }))
    .filter(({ option }) => isStockedOption(option) && Number(option.weightGrams) > 0)
    .sort((a, b) => {
      const aDistance = Math.abs(Number(a.option.weightGrams) - preferredWeight);
      const bDistance = Math.abs(Number(b.option.weightGrams) - preferredWeight);
      return aDistance - bDistance;
    });
  return candidates[0]?.optionIndex ?? -1;
};

export const ensureWholesaleMinimum = (selections) => {
  const adjusted = selections.map((selection) => ({
    ...selection,
    quantity: Math.max(1, Math.floor(Number(selection.quantity) || 1)),
  }));
  const selectionWeight = (selection) =>
    Number(selection.product.options[selection.optionIndex]?.weightGrams) || 0;
  let totalWeight = adjusted.reduce(
    (total, selection) => total + selectionWeight(selection) * selection.quantity,
    0
  );
  let guard = 0;

  while (totalWeight < MIN_ORDER_GRAMS && guard < 1000) {
    const eligible = adjusted
      .filter((selection) => {
        const option = selection.product.options[selection.optionIndex];
        return (
          selectionWeight(selection) > 0 &&
          (option.stockQuantity == null ||
            selection.quantity < Number(option.stockQuantity))
        );
      })
      .sort((a, b) => selectionWeight(b) - selectionWeight(a));
    if (eligible.length === 0) break;
    eligible[guard % eligible.length].quantity += 1;
    totalWeight += selectionWeight(eligible[guard % eligible.length]);
    guard += 1;
  }

  return {
    selections: adjusted,
    totalWeight,
    meetsMinimum: totalWeight >= MIN_ORDER_GRAMS,
  };
};

export const rankHistoricalItems = (orders) => {
  const stats = new Map();
  (orders || []).slice(0, 12).forEach((order, orderIndex) => {
    const recencyWeight = Math.max(1, 12 - orderIndex);
    (order.items || []).forEach((item) => {
      const key =
        `${order.storeId || "sacred-connection"}:` +
        `${item.variationId || item.productId || normalizeSuggestionText(item.sku)}`;
      const current = stats.get(key) || {
        ...item,
        storeId: order.storeId,
        score: 0,
        occurrences: 0,
        totalQuantity: 0,
        latestQuantity: Number(item.quantity) || 1,
      };
      current.score += recencyWeight * Math.max(1, Number(item.quantity) || 1);
      current.occurrences += 1;
      current.totalQuantity += Math.max(1, Number(item.quantity) || 1);
      stats.set(key, current);
    });
  });

  return [...stats.values()]
    .sort((a, b) => b.score - a.score)
    .map((item) => ({
      ...item,
      suggestedQuantity: Math.max(
        1,
        Math.round(item.totalQuantity / item.occurrences)
      ),
    }));
};

export async function mapWithClientConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    for (;;) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(Math.max(1, concurrency), items.length) },
      () => worker()
    )
  );
  return results;
}
