// Verified against WooCommerce IDs and the labels on the existing local assets.
// These are fallback images only; a WooCommerce image always takes precedence.
export const FALLBACK_PRODUCT_IMAGES = Object.freeze({
  5718: "/products/caboclo/Mockup_2026_Sacos_Família_CABOCLO-AmazonGreen.jpg",
  3880: "/products/sacred-connection/Mockup_2026_Sacos_Família_SACREDCONNECTION-TsunuStrong.jpg",
  3431: "/products/kuntanawa/Mockup_2026_Sacos_Família_KUNTANAWA-Alfavaca.jpg",
});

export function getCatalogImage(product = {}) {
  const firstImage = product.images?.[0];
  const current = product.image || (typeof firstImage === "string" ? firstImage : firstImage?.src);
  if (current) return current;
  if (product.storeId && product.storeId !== "sacred-connection") return null;
  const local = FALLBACK_PRODUCT_IMAGES[Number(product.wcId ?? product.id)];
  // null intentionally keeps the UI's missing-photo placeholder for unmatched products.
  return local ? local.split("/").map(encodeURIComponent).join("/") : null;
}
