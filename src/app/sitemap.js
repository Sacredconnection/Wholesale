import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600;

const staticRoutes = [
  ["", "daily", 1],
  ["/about", "monthly", 0.8],
  ["/suggested-blends", "weekly", 0.8],
  ["/contact", "monthly", 0.7],
  ["/register", "monthly", 0.7],
  ["/shipping-and-returns-policy", "monthly", 0.5],
  ["/privacy-policy", "monthly", 0.5],
];

export default function sitemap() {
  return staticRoutes.map(([path, changeFrequency, priority]) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
