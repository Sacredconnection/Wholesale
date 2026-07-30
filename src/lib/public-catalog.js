import "server-only";

import { cache } from "react";
import {
  getAllProducts,
  getCategories,
  getProductBySlug,
  getProductVariations,
} from "@/lib/woocommerce";
import {
  getRequiredCommerceStores,
  PRIMARY_STORE_ID,
} from "@/lib/commerce-stores";
import {
  buildCategoryContext,
  mapProductForRole,
  stripProductPricing,
} from "@/lib/wc-mappers";

const productPath = (slug) => `/product/${encodeURIComponent(slug)}`;

export const getPublicCatalogProducts = cache(async () => {
  const catalogs = await Promise.all(
    getRequiredCommerceStores().map(async (store) => {
      const [products, categories] = await Promise.all([
        getAllProducts(store.id),
        getCategories(store.id),
      ]);
      const categoryContext = buildCategoryContext(categories);

      return products.map((product) => {
        const mapped = stripProductPricing(
          mapProductForRole(product, [], categoryContext, null, store)
        );
        return { ...mapped, productUrl: productPath(mapped.slug) };
      });
    })
  );

  return catalogs
    .flat()
    .sort((left, right) => left.name.localeCompare(right.name));
});

export const getPublicProductBySlug = cache(
  async (slug, storeId = PRIMARY_STORE_ID) => {
    if (!/^[a-z0-9-]+$/i.test(String(slug || ""))) return null;
    const store = getRequiredCommerceStores().find(
      (entry) => entry.id === storeId
    );
    if (!store) return null;

    const product = await getProductBySlug(slug, store.id);
    if (!product) return null;

    const [variations, categories] = await Promise.all([
      product.type === "variable"
        ? getProductVariations(product.id, store.id)
        : [],
      getCategories(store.id),
    ]);
    const mapped = stripProductPricing(
      mapProductForRole(
        product,
        variations,
        buildCategoryContext(categories),
        null,
        store
      )
    );
    return { ...mapped, productUrl: productPath(mapped.slug) };
  }
);
