import {
  getAllProducts,
  getCategories,
  getCustomerByEmail,
  getProductVariations,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { getMissingCommerceStores, getRequiredCommerceStores } from "@/lib/commerce-stores";
import { buildCategoryContext, isApprovedWholesaleCustomer, mapProductForRole } from "@/lib/wc-mappers";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";

async function loadStoreCatalog(store, role) {
  const [wcProducts, categories] = await Promise.all([
    getAllProducts(store.id),
    getCategories(store.id),
  ]);
  const categoryContext = buildCategoryContext(categories);

  return Promise.all(
    wcProducts.map(async (product) => {
      const variations =
        product.type === "variable"
          ? await getProductVariations(product.id, store.id)
          : [];
      return mapProductForRole(product, variations, categoryContext, role, store);
    })
  );
}

export async function GET() {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);

  const missingStores = getMissingCommerceStores();
  if (missingStores.length > 0) {
    return Response.json(
      {
        error: `Catalog backends are not configured: ${missingStores.map((store) => store.name).join(", ")}.`,
      },
      { status: 503 }
    );
  }

  try {
    const customer = await getCustomerByEmail(session.email);
    if (!isApprovedWholesaleCustomer(customer) || customer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }

    const catalogs = await Promise.all(
      getRequiredCommerceStores().map((store) => loadStoreCatalog(store, customer.role))
    );
    const products = catalogs.flat().sort((a, b) => a.name.localeCompare(b.name));

    return Response.json(
      { products },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("GET /api/products failed:", err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json(
      { error: "Failed to load products from the configured WooCommerce stores." },
      { status }
    );
  }
}
