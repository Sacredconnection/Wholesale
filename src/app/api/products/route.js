import {
  getAllProducts,
  getCategories,
  getCustomerByEmail,
  getProductVariations,
  isWooCommerceConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { buildCategoryContext, isApprovedWholesaleCustomer, mapProductForRole } from "@/lib/wc-mappers";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  if (!isWooCommerceConfigured()) {
    return securityError("Catalog backend unavailable.", 503);
  }

  try {
    const [customer, wcProducts, categories] = await Promise.all([
      getCustomerByEmail(session.email),
      getAllProducts(),
      getCategories(),
    ]);
    if (!isApprovedWholesaleCustomer(customer) || customer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }
    const categoryContext = buildCategoryContext(categories);
    const products = await Promise.all(
      wcProducts.map(async (p) => {
        const variations = p.type === "variable" ? await getProductVariations(p.id) : [];
        return mapProductForRole(p, variations, categoryContext, customer.role);
      })
    );
    return Response.json({ products }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("GET /api/products failed:", err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json(
      { error: "Failed to load products from WooCommerce." },
      { status }
    );
  }
}
