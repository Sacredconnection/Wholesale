import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "Sacred Connection Wholesale | B2B Portal",
  description: "Direct fair-trade sourcing of sacred Amazonian snuffs (rapé) and traditional forest remedies. Access our verified B2B wholesale platform.",
  keywords: [
    "sacred connection",
    "wholesale rapé",
    "shamanic snuff wholesale",
    "huni kuin",
    "yawanawa",
    "amazonian remedies B2B",
    "indigenous direct trade"
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Sacred Connection Wholesale | B2B Portal",
    description: "Sustainably sourced, direct fair-trade sacred medicines from the heart of the Amazon forest.",
    type: "website",
    locale: "en_US",
    siteName: "Sacred Connection Wholesale",
    url: "https://wholesale.sacredconnection.com",
    images: [
      {
        url: "/hero-banner.png",
        width: 1200,
        height: 630,
        alt: "Sacred Connection Wholesale - Amazon Canopy",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sacred Connection Wholesale | B2B Portal",
    description: "Direct fair-trade sourcing of sacred Amazonian snuffs (rapé) and traditional forest remedies.",
    images: ["/hero-banner.png"],
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
      "@id": "https://wholesale.sacredconnection.com/#organization",
      "name": "Sacred Connection Wholesale",
      "url": "https://wholesale.sacredconnection.com",
      "logo": "https://wholesale.sacredconnection.com/logo.png",
      "description": "Direct fair-trade sourcing of sacred Amazonian snuffs (rapé) and traditional forest remedies. Access our verified B2B wholesale platform.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "B2B Support",
        "email": "support@sacredconnection.com"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": "https://wholesale.sacredconnection.com/#website",
      "name": "Sacred Connection Wholesale | B2B Portal",
      "url": "https://wholesale.sacredconnection.com"
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
