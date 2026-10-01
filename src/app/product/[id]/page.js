import ProductDetailClient from "@/components/ProductDetailClient";
import CatalogAccessGate from "@/components/CatalogAccessGate";

export const metadata = {
  title: "Product | Sacred Connection Wholesale Europa",
  robots: { index: false, follow: false },
};

export default async function ProductPage({ params }) {
  const { id } = await params;
  return <CatalogAccessGate><ProductDetailClient initialProduct={{ slug: id, id }} /></CatalogAccessGate>;
}
