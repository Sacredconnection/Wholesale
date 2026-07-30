import {
  getCategories,
  getCustomerByEmail,
  getProductBySlug,
  getProductVariations,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { getRequiredCommerceStores, isCommerceStoreConfigured } from "@/lib/commerce-stores";
import {
  buildCategoryContext,
  isApprovedWholesaleCustomer,
  mapProductForRole,
  stripProductPricing,
} from "@/lib/wc-mappers";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";
import { enforceRateLimit, rateLimitIdentity } from "@/lib/abuse-protection";

function parseProductIdentifier(identifier) {
  if (typeof identifier !== "string" || identifier.length > 240) return null;
  const separator = identifier.indexOf("~");
  const storeId = separator < 1 ? "sacred-connection" : identifier.slice(0, separator);
  const slug = separator < 1 ? identifier : identifier.slice(separator + 1);
  if (!/^[a-z0-9-]+$/i.test(storeId) || !/^[a-z0-9-]+$/i.test(slug)) return null;
  const store = getRequiredCommerceStores().find((entry) => entry.id === storeId);
  return store ? { store, slug } : null;
}

export async function GET(request, { params }) {
  const rateLimit = await enforceRateLimit(request, {
    namespace: "product-read",
    limit: 120,
    windowSeconds: 60,
    identity: rateLimitIdentity(request),
  });
  if (rateLimit) return rateLimit;
  const session = await getSession();

  const { id } = await params;
  const identity = parseProductIdentifier(id);
  if (!identity) return securityError("Invalid product identifier.", 400);
  if (!isCommerceStoreConfigured(identity.store.id)) {
    return securityError(`${identity.store.name} catalog is temporarily unavailable.`, 503);
  }

  try {
    const [customer, wcProduct] = await Promise.all([
      session ? getCustomerByEmail(session.email) : Promise.resolve(null),
      getProductBySlug(identity.slug, identity.store.id),
    ]);
    if (!wcProduct) return Response.json({ error: "Product not found." }, { status: 404 });
    const revealPricing = Boolean(
      session &&
        isApprovedWholesaleCustomer(customer) &&
        customer.id === session.customerId
    );

    const [variations, categories] = await Promise.all([
      wcProduct.type === "variable"
        ? getProductVariations(wcProduct.id, identity.store.id)
        : [],
      getCategories(identity.store.id),
    ]);
    const mapped = mapProductForRole(
          wcProduct,
          variations,
          buildCategoryContext(categories),
          revealPricing ? customer.role : null,
          identity.store
        );
    const product = revealPricing ? mapped : stripProductPricing(mapped);
    return Response.json(
      {
        product: {
          ...product,
          productUrl: `/product/${encodeURIComponent(mapped.slug)}`,
        },
        viewer: { authenticated: revealPricing },
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error(`GET /api/products/${id} failed:`, err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json(
      { error: `Failed to load product from ${identity.store.name}.` },
      { status }
    );
  }
}
