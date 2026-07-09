export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/private/", "/portal/"],
    },
    sitemap: "https://wholesale.sacredconnection.com/sitemap.xml",
  };
}
