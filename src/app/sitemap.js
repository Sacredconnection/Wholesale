import { getPublicCatalogProducts } from "@/lib/public-catalog";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600;

const staticRoutes = [
  ["", "daily", 1],
  ["/about", "monthly", 0.8],
  ["/catalog", "weekly", 0.9],
  ["/digital-catalog", "weekly", 0.9],
  ["/suggested-blends", "weekly", 0.8],
  ["/contact", "monthly", 0.7],
  ["/register", "monthly", 0.7],
  ["/shipping-and-returns-policy", "monthly", 0.5],
  ["/privacy-policy", "monthly", 0.5],
];

export default async function sitemap() {
  const now = new Date();
  const entries = staticRoutes.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  try {
    const products = await getPublicCatalogProducts();
    entries.push(
      ...products.map((product) => ({
        url: `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
        lastModified: product.dateModified
          ? new Date(product.dateModified)
          : now,
        changeFrequency: "weekly",
        priority: 0.75,
        images: product.image ? [product.image] : undefined,
      }))
    );
  } catch (error) {
    console.error("Unable to add product URLs to sitemap:", error);
  }

  return entries;
}
