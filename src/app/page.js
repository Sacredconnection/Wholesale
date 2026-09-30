import HomeClient from "@/components/HomeClient";
import { SITE_URL } from "@/lib/site-config";

export const metadata = {
  title: "Amazonian Botanicals for Europe | Wholesale Europa",
  description: "Explore Amazonian botanicals for European businesses. Browse retail and bulk formats, apply for trade access and plan orders with Wholesale Europa.",
  keywords: [
    "sacred connection",
    "rapeh wholesale Europe",
    "Amazonian botanicals Europe",
    "traditional botanical products",
    "responsible wholesale sourcing",
    "indigenous direct trade",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Amazonian Botanicals for Europe | Wholesale Europa",
    description: "Botanical collections for European retailers: explore product origins, compare wholesale formats and apply for a business account.",
    type: "website",
    locale: "en_GB",
    siteName: "Sacred Connection Wholesale Europa",
    url: SITE_URL,
    images: [
      {
        url: "/banner/sacred-connection-hero/sacred-connection-hero-desktop.webp",
        alt: "Sacred Connection Wholesale Europa - Amazon Canopy",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Amazonian Botanicals for Europe | Wholesale Europa",
    description: "Discover Wholesale Europa, the Sacred Connection B2B portal for European botanical retailers and trade buyers.",
    images: ["/banner/sacred-connection-hero/sacred-connection-hero-desktop.webp"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function Page() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "Sacred Connection Wholesale Europa",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo.svg`,
      "description": "Explore Amazonian botanicals for European businesses. Browse retail and bulk formats, apply for trade access and plan orders with Wholesale Europa.",
      "areaServed": { "@type": "Place", "name": "Europe" },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "B2B Support",
        "email": "info@sacredconnection.co"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "name": "Amazonian Botanicals for Europe | Wholesale Europa",
      "url": SITE_URL
    }
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomeClient />
    </>
  );
}
