import "server-only";

import { getPublicStoreCatalog } from "@/lib/woocommerce";
import {
  buildCategoryContext,
  mapStoreProduct,
  stripProductPricing,
} from "@/lib/wc-mappers";

export async function loadPublicStoreProducts(store, { revalidate } = {}) {
  const catalog = await getPublicStoreCatalog(store.id, { revalidate });
  const categoryContext = buildCategoryContext(catalog.categories);
  const variationsByParent = new Map();
  catalog.variations.forEach((variation) => {
    if (!variationsByParent.has(variation.parent)) {
      variationsByParent.set(variation.parent, []);
    }
    variationsByParent.get(variation.parent).push(variation);
  });

  return catalog.products.map((product) => {
    const mapped = stripProductPricing(
      mapStoreProduct(
        product,
        variationsByParent.get(product.id) || [],
        categoryContext,
        store
      )
    );
    return {
      ...mapped,
      productUrl: `/product/${encodeURIComponent(mapped.slug)}`,
    };
  });
}

export async function loadPublicStoreProductBySlug(
  store,
  slug,
  { revalidate } = {}
) {
  const products = await loadPublicStoreProducts(store, { revalidate });
  return products.find((product) => product.slug === slug) || null;
}
