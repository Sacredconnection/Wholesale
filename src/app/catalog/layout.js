export const metadata = {
  title: "Wholesale Catalog | Sacred Connection Wholesale Europa",
  description:
    "Browse Amazonian botanicals, retail tins and bulk formats for European businesses. Access partner pricing through an approved Wholesale Europa account.",
  alternates: {
    canonical: "/catalog",
  },
  openGraph: {
    title: "Europe Wholesale Catalog | Sacred Connection",
    description:
      "Explore Amazonian botanical collections for European trade buyers. Compare formats and sign in with an approved account for wholesale pricing.",
    type: "website",
    url: "/catalog",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function CatalogLayout({ children }) {
  return children;
}
