import {
  getCategories,
  getCustomerByEmail,
  getProductBySlug,
  getProductVariations,
  isWooCommerceConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { buildCategoryContext, isApprovedWholesaleCustomer, mapProductForRole } from "@/lib/wc-mappers";
import { securityError } from "@/lib/request-security";
import { getSession } from "@/lib/session";

export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return securityError("Authentication required.", 401);
  if (!isWooCommerceConfigured()) {
    return securityError("Catalog backend unavailable.", 503);
  }

  const { id } = await params;
  if (typeof id !== "string" || id.length > 200 || !/^[a-z0-9-]+$/i.test(id)) {
    return securityError("Invalid product identifier.", 400);
  }

  try {
    const [customer, wcProduct] = await Promise.all([
      getCustomerByEmail(session.email),
      getProductBySlug(id),
    ]);
    if (!isApprovedWholesaleCustomer(customer) || customer.id !== session.customerId) {
      return securityError("Authentication required.", 401);
    }
    if (!wcProduct) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    const [variations, categories] = await Promise.all([
      wcProduct.type === "variable" ? getProductVariations(wcProduct.id) : [],
      getCategories(),
    ]);
    return Response.json(
      {
        product: mapProductForRole(
          wcProduct,
          variations,
          buildCategoryContext(categories),
          customer.role
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error(`GET /api/products/${id} failed:`, err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json(
      { error: "Failed to load product from WooCommerce." },
      { status }
    );
  }
}
