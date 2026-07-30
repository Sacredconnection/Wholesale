import SuggestedBlendsPageClient from "@/components/SuggestedBlendsPageClient";

export const metadata = {
  title: "Suggested Wholesale Blends | Sacred Connection",
  description:
    "Explore stock-aware wholesale order suggestions organized by indigenous lineage and catalog profile, including Yawanawá and mixed indigenous nation assortments.",
  alternates: { canonical: "/suggested-blends" },
  openGraph: {
    title: "Suggested Wholesale Blends | Sacred Connection",
    description:
      "Curated wholesale assortments rebuilt from current product availability.",
    type: "website",
    url: "/suggested-blends",
  },
  robots: { index: true, follow: true },
};

export default function SuggestedBlendsPage() {
  return <SuggestedBlendsPageClient />;
}
