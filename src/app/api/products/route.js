import {
  getAllProducts,
  getCategories,
  getProductVariations,
  isWooCommerceConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { buildCategoryContext, mapProduct } from "@/lib/wc-mappers";

export async function GET() {
  if (!isWooCommerceConfigured()) {
    return Response.json(
      { error: "WooCommerce backend is not configured." },
      { status: 503 }
    );
  }

  try {
    const [wcProducts, categories] = await Promise.all([
      getAllProducts(),
      getCategories(),
    ]);
    const categoryContext = buildCategoryContext(categories);
    const products = await Promise.all(
      wcProducts.map(async (p) => {
        const variations = p.type === "variable" ? await getProductVariations(p.id) : [];
        return mapProduct(p, variations, categoryContext);
      })
    );
    return Response.json({ products });
  } catch (err) {
    console.error("GET /api/products failed:", err);
    const status = err instanceof WooCommerceApiError && err.status >= 400 ? 502 : 500;
    return Response.json(
      { error: "Failed to load products from WooCommerce." },
      { status }
    );
  }
}
