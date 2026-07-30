import CatalogClient from "@/components/CatalogClient";
import { getPublicCatalogProducts } from "@/lib/public-catalog";

export const revalidate = 300;

export default async function CatalogPage() {
  let products = [];
  try {
    products = await getPublicCatalogProducts();
  } catch (error) {
    console.error("Unable to pre-render the public catalog:", error);
  }

  return <CatalogClient initialProducts={products} />;
}
