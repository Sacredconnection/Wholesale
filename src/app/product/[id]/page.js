import { notFound, permanentRedirect } from "next/navigation";
import ProductDetailClient from "@/components/ProductDetailClient";
import { getPublicProductBySlug } from "@/lib/public-catalog";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 300;

const canonicalSlug = (identifier) =>
  String(identifier || "").includes("~")
    ? String(identifier).split("~").pop()
    : String(identifier || "");

const descriptionFor = (product) =>
  (product?.description ||
    `${product?.name || "Product"} from the Sacred Connection wholesale catalog.`)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

export async function generateMetadata({ params }) {
  const { id } = await params;
  const slug = canonicalSlug(id);
  const product = await getPublicProductBySlug(slug).catch(() => null);
  if (!product) {
    return {
      title: "Product Not Found | Sacred Connection Wholesale",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/product/${product.slug}`;
  const description = descriptionFor(product);
  return {
    title: `${product.name} | Sacred Connection Wholesale`,
    description,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: canonical,
      images: product.image
        ? [{ url: product.image, alt: product.name }]
        : undefined,
    },
    twitter: {
      card: product.image ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: product.image ? [product.image] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const slug = canonicalSlug(id);
  if (id !== slug) permanentRedirect(`/product/${encodeURIComponent(slug)}`);

  const product = await getPublicProductBySlug(slug).catch((error) => {
    console.error(`Unable to render public product ${slug}:`, error);
    return null;
  });
  if (!product) notFound();

  const productUrl = `${SITE_URL}/product/${encodeURIComponent(product.slug)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemPage",
      "@id": productUrl,
      url: productUrl,
      name: product.name,
      description: descriptionFor(product),
      primaryImageOfPage: product.image
        ? {
            "@type": "ImageObject",
            contentUrl: product.image,
          }
        : undefined,
      about: {
        "@type": "Thing",
        name: product.name,
        description: descriptionFor(product),
        image: product.image || undefined,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Wholesale Catalog",
          item: `${SITE_URL}/catalog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: product.name,
          item: productUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ProductDetailClient initialProduct={product} />
    </>
  );
}
