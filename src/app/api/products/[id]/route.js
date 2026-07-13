import {
  getProductBySlug,
  getProductVariations,
  isWooCommerceConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { mapProduct } from "@/lib/wc-mappers";

export async function GET(request, { params }) {
  if (!isWooCommerceConfigured()) {
    return Response.json(
      { error: "WooCommerce backend is not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;

  try {
    const wcProduct = await getProductBySlug(id);
    if (!wcProduct) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    const variations =
      wcProduct.type === "variable" ? await getProductVariations(wcProduct.id) : [];
    return Response.json({ product: mapProduct(wcProduct, variations) });
  } catch (err) {
    console.error(`GET /api/products/${id} failed:`, err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json(
      { error: "Failed to load product from WooCommerce." },
      { status }
    );
  }
}
