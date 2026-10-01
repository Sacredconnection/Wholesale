import CatalogClient from "@/components/CatalogClient";
import { getPublicCatalogProducts } from "@/lib/public-catalog";

export const revalidate = 300;

const PRODUCTS_PER_PAGE = 8;

const firstQueryValue = (value) =>
  Array.isArray(value) ? value[0] : value;

const requestedPage = (value) => {
  const parsed = Number.parseInt(firstQueryValue(value) || "1", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
};

const canonicalForPage = (page) =>
  page > 1 ? `/catalog?page=${page}` : "/catalog";

const catalogDescription =
  "Explore our public wholesale assortment. Partner pricing is shown only after approved account login.";

export async function generateMetadata({ searchParams }) {
  const query = await searchParams;
  const page = requestedPage(query.page);

  return {
    alternates: {
      canonical: canonicalForPage(page),
    },
    openGraph: {
      title: "Wholesale Product Catalog | Sacred Connection",
      description: catalogDescription,
      type: "website",
      url: canonicalForPage(page),
    },
  };
}

export default async function CatalogPage({ searchParams }) {
  const query = await searchParams;
  const page = requestedPage(query.page);
  let products = [];
  try {
    products = await getPublicCatalogProducts();
  } catch (error) {
    console.error("Unable to pre-render the public catalog:", error);
  }

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const initialPage = Math.min(page, totalPages);

  return (
    <CatalogClient
      key={`catalog-page-${initialPage}`}
      initialProducts={products}
      initialPage={initialPage}
    />
  );
}
