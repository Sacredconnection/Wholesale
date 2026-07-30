export const metadata = {
  title: "Wholesale Catalog | Sacred Connection Wholesale",
  description:
    "Browse Sacred Connection's wholesale catalog, available product formats, indigenous lineages, and responsibly sourced Amazonian botanicals. Approved partners can sign in for private pricing.",
  alternates: {
    canonical: "/catalog",
  },
  openGraph: {
    title: "Wholesale Product Catalog | Sacred Connection",
    description:
      "Explore our public wholesale assortment. Partner pricing is shown only after approved account login.",
    type: "website",
    url: "/catalog",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CatalogLayout({ children }) {
  return children;
}
