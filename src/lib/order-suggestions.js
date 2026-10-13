// Shared catalog matching and concurrency helpers for reordering past purchases.

export const normalizeSuggestionText = (value) =>
  String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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
