import "server-only";

import { cache } from "react";
import {
  getRequiredCommerceStores,
  PRIMARY_STORE_ID,
} from "@/lib/commerce-stores";
import {
  loadPublicStoreProductBySlug,
  loadPublicStoreProducts,
} from "@/lib/public-store-catalog";
import { getLocalDevUpstreamOrigin } from "@/lib/local-dev-upstream";

const productPath = (slug) => `/product/${encodeURIComponent(slug)}`;

async function fetchLocalUpstream(path) {
  const origin = getLocalDevUpstreamOrigin();
  if (!origin) return null;
  const target = new URL(path, origin);
  if (target.origin !== origin || !target.pathname.startsWith("/api/")) {
    throw new Error("Invalid local development catalog upstream path.");
  }
  const response = await fetch(target, {
    headers: { Accept: "application/json", Origin: origin },
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`Local catalog upstream failed with status ${response.status}.`);
  }
  return response.json();
}

export const getPublicCatalogProducts = cache(async () => {
  const upstream = await fetchLocalUpstream("/api/products");
  if (upstream) {
    return (Array.isArray(upstream.products) ? upstream.products : []).sort(
      (left, right) => left.name.localeCompare(right.name)
    );
  }

  const catalogs = await Promise.all(
    getRequiredCommerceStores().map((store) => loadPublicStoreProducts(store))
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

    const upstream = await fetchLocalUpstream(
      `/api/products/${encodeURIComponent(`${store.id}~${slug}`)}`
    );
    if (upstream) return upstream.product || null;

    const product = await loadPublicStoreProductBySlug(store, slug);
    return product ? { ...product, productUrl: productPath(product.slug) } : null;
  }
);
