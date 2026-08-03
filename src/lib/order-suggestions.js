import {
  cartUnitPrice,
  normalizeQuantityForWeight,
  orderMinimumStatus,
  optionPriceForUser,
  quantityStepForWeight,
} from "@/lib/pricing";

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
    .filter(({ option }) => {
      const quantityStep = quantityStepForWeight(option.weightGrams);
      return (
        isStockedOption(option) &&
        Number(option.weightGrams) > 0 &&
        (option.stockQuantity == null ||
          Number(option.stockQuantity) >= quantityStep)
      );
    })
    .sort((a, b) => {
      const aDistance = Math.abs(Number(a.option.weightGrams) - preferredWeight);
      const bDistance = Math.abs(Number(b.option.weightGrams) - preferredWeight);
      return aDistance - bDistance;
    });
  return candidates[0]?.optionIndex ?? -1;
};

export const ensureWholesaleMinimum = (selections, user = null) => {
  const adjusted = selections.flatMap((selection) => {
    const option = selection.product.options[selection.optionIndex];
    if (!option) return [];
    const quantityStep = quantityStepForWeight(option.weightGrams);
    const normalized = normalizeQuantityForWeight(
      selection.quantity,
      option.weightGrams
    );
    const maxQuantity =
      option.stockQuantity == null
        ? null
        : Math.floor(Number(option.stockQuantity) / quantityStep) *
          quantityStep;
    if (maxQuantity != null && maxQuantity < quantityStep) return [];
    return [{
      ...selection,
      quantity: maxQuantity == null
        ? normalized
        : Math.min(normalized, maxQuantity),
    }];
  });
  const selectionWeight = (selection) =>
    Number(selection.product.options[selection.optionIndex]?.weightGrams) || 0;
  const calculateTotals = () => {
    const totalWeight = adjusted.reduce(
      (total, selection) =>
        total + selectionWeight(selection) * selection.quantity,
      0
    );
    const subtotal = adjusted.reduce((total, selection) => {
      const option = selection.product.options[selection.optionIndex];
      const capturedPrice = optionPriceForUser(
        option,
        user,
        selection.product.category
      );
      const unitPrice = cartUnitPrice(
        {
          ...option,
          price: capturedPrice,
          category: selection.product.category,
        },
        user,
        totalWeight
      );
      return total + unitPrice * selection.quantity;
    }, 0);
    const discountRate = Math.min(
      100,
      Math.max(0, Number(user?.discountRate) || 0)
    );
    return {
      totalWeight,
      totalAmount: subtotal * (1 - discountRate / 100),
    };
  };

  let { totalWeight, totalAmount } = calculateTotals();
  if (!user) {
    return {
      selections: adjusted,
      totalWeight,
      totalAmount: null,
      meetsMinimum: adjusted.length > 0,
    };
  }
  const hasPricedSelection = adjusted.some((selection) => {
    const option = selection.product.options[selection.optionIndex];
    return (
      optionPriceForUser(option, user, selection.product.category) > 0
    );
  });
  if (!hasPricedSelection) {
    return {
      selections: adjusted,
      totalWeight,
      totalAmount,
      meetsMinimum: false,
    };
  }
  let guard = 0;
  let minimumStatus = orderMinimumStatus(user, totalAmount, totalWeight);

  while (!minimumStatus.meetsMinimum && guard < 1000) {
    const eligible = adjusted
      .filter((selection) => {
        const option = selection.product.options[selection.optionIndex];
        const quantityStep = quantityStepForWeight(option.weightGrams);
        return (
          selectionWeight(selection) > 0 &&
          (option.stockQuantity == null ||
            selection.quantity + quantityStep <= Number(option.stockQuantity))
        );
      })
      .sort((a, b) => {
        const aOption = a.product.options[a.optionIndex];
        const bOption = b.product.options[b.optionIndex];
        const aValue =
          optionPriceForUser(aOption, user, a.product.category) *
          quantityStepForWeight(aOption.weightGrams);
        const bValue =
          optionPriceForUser(bOption, user, b.product.category) *
          quantityStepForWeight(bOption.weightGrams);
        return bValue - aValue;
      });
    if (eligible.length === 0) break;
    const selected = eligible[guard % eligible.length];
    selected.quantity += quantityStepForWeight(
      selected.product.options[selected.optionIndex].weightGrams
    );
    ({ totalWeight, totalAmount } = calculateTotals());
    minimumStatus = orderMinimumStatus(user, totalAmount, totalWeight);
    guard += 1;
  }

  return {
    selections: adjusted,
    totalWeight,
    totalAmount,
    meetsMinimum: minimumStatus.meetsMinimum,
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
