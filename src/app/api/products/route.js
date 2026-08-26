import { unstable_cache } from "next/cache";
import {
  getAllProducts,
  getCategories,
  getCustomerByEmail,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import {
  getRequiredCommerceStores,
  isCommerceStoreConfigured,
} from "@/lib/commerce-stores";
import {
  buildCategoryContext,
  isAdminCustomer,
  isApprovedWholesaleCustomer,
  mapProductForRole,
  stripProductPricing,
} from "@/lib/wc-mappers";
import { loadPublicStoreProducts } from "@/lib/public-store-catalog";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { enforceRateLimit, rateLimitIdentity } from "@/lib/abuse-protection";
import {
  isLocalDevUpstreamEnabled,
  proxyLocalDevUpstream,
} from "@/lib/local-dev-upstream";

const catalogCacheSeconds = (() => {
  const value = Number(process.env.WC_REVALIDATE_SECONDS);
  return Number.isFinite(value) && value >= 30 ? value : 300;
})();
async function loadStoreCatalog(storeId, storeName, role, revealPricing, includePrivate) {
  const [wcProducts, categories] = await Promise.all([
    getAllProducts(storeId, { includePrivate }),
    getCategories(storeId),
  ]);
  const categoryContext = buildCategoryContext(categories);
  const store = { id: storeId, name: storeName };

  return wcProducts.map((product) => {
    const mapped = mapProductForRole(
      product,
      [],
      categoryContext,
      role,
      store
    );
    const visible = revealPricing ? mapped : stripProductPricing(mapped);
    return {
      ...visible,
      productUrl: `/product/${encodeURIComponent(mapped.slug)}`,
    };
  });
}

const getCachedStoreCatalog = unstable_cache(
  loadStoreCatalog,
  ["sacred-connection-catalog-v3"],
  { revalidate: catalogCacheSeconds, tags: ["woocommerce-catalog"] }
);

export async function GET(request) {
  const rateLimit = await enforceRateLimit(request, {
    namespace: "products-read",
    limit: 120,
    windowSeconds: 60,
    identity: rateLimitIdentity(request),
  });
  if (rateLimit) return rateLimit;
  if (isLocalDevUpstreamEnabled()) {
    return proxyLocalDevUpstream(request);
  }
  const session = await getSession();

  const requestedStoreId = new URL(request.url).searchParams.get("store");
  const allStores = getRequiredCommerceStores();
  const stores = requestedStoreId
    ? allStores.filter((store) => store.id === requestedStoreId)
    : allStores;
  if (stores.length === 0) return securityError("Unknown catalog store.", 400);

  const missingStores = stores.filter((store) => !isCommerceStoreConfigured(store.id));
  if (missingStores.length > 0) {
    return Response.json(
      {
        error: "The catalog is temporarily unavailable.",
      },
      { status: 503 }
    );
  }

  try {
    const customer = session
      ? await getCustomerByEmail(session.email)
      : null;
    const revealPricing = Boolean(
      session &&
        isApprovedWholesaleCustomer(customer) &&
        customer.id === session.customerId
    );

    const catalogs = await Promise.all(
      stores.map((store) =>
        revealPricing
          ? getCachedStoreCatalog(
              store.id,
              store.name,
              customer.role,
              true,
              isAdminCustomer(customer)
            )
          : loadPublicStoreProducts(store)
      )
    );
    const products = catalogs.flat().sort((a, b) => a.name.localeCompare(b.name));

    return Response.json(
      {
        products,
        stores: stores.map(({ id, name }) => ({ id, name })),
        viewer: { authenticated: revealPricing },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error(
      `GET /api/products failed for ${stores.map((store) => store.id).join(",")}:`,
      err
    );
    const upstreamStatus = err instanceof WooCommerceApiError ? err.status : 0;
    const status = upstreamStatus >= 400 ? 502 : 504;
    const storeNames = stores.map((store) => store.name).join(" and ");
    const errorMessage =
      upstreamStatus === 401
        ? `The ${storeNames} catalog is temporarily unavailable.`
        : `The ${storeNames} catalog took too long or could not be loaded.`;
    return Response.json(
      { error: errorMessage },
      { status }
    );
  }
}
