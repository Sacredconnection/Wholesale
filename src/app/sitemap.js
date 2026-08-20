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

const validModifiedDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default async function sitemap() {
  const entries = staticRoutes.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));

  try {
    const products = await getPublicCatalogProducts();
    entries.push(
      ...products.map((product) => {
        const lastModified = validModifiedDate(product.dateModified);
        return {
          url: `${SITE_URL}/product/${encodeURIComponent(product.slug)}`,
          ...(lastModified ? { lastModified } : {}),
          changeFrequency: "weekly",
          priority: 0.75,
          images: product.image ? [product.image] : undefined,
        };
      })
    );
  } catch (error) {
    console.error("Unable to add product URLs to sitemap:", error);
  }

  return entries;
}
