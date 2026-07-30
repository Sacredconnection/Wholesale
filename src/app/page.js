import HomeClient from "@/components/HomeClient";
import { SITE_URL } from "@/lib/site-config";

export const metadata = {
  title: "Sacred Connection Wholesale | B2B Portal",
  description: "Direct fair-trade sourcing of traditional Amazonian botanical products. Access our verified B2B wholesale platform.",
  keywords: [
    "sacred connection",
    "rapeh wholesale",
    "Amazonian botanicals",
    "traditional botanical products",
    "responsible wholesale sourcing",
    "indigenous direct trade",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sacred Connection Wholesale | B2B Portal",
    description: "Responsibly sourced Amazonian botanical products supplied through direct fair-trade relationships.",
    type: "website",
    locale: "en_US",
    siteName: "Sacred Connection Wholesale",
    url: SITE_URL,
    images: [
      {
        url: "/banner/hero-banner.webp",
        alt: "Sacred Connection Wholesale - Amazon Canopy",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sacred Connection Wholesale | B2B Portal",
    description: "Direct fair-trade sourcing of traditional Amazonian botanical products for wholesale partners.",
    images: ["/banner/hero-banner.webp"],
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
      "name": "Sacred Connection Wholesale",
      "url": SITE_URL,
      "logo": `${SITE_URL}/logo.svg`,
      "description": "Direct fair-trade sourcing of traditional Amazonian botanical products. Access our verified B2B wholesale platform.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "B2B Support",
        "email": "support@sacredconnection.com"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "name": "Sacred Connection Wholesale | B2B Portal",
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
