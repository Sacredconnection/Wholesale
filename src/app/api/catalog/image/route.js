import { getCommerceStoreOrigins } from "@/lib/commerce-stores";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("url");
    const wantsImageResponse = searchParams.get("format") === "image";
    if (!source) return new Response("Missing image URL.", { status: 400 });

    const target = new URL(source);
    const catalogHosts = new Set(
      getCommerceStoreOrigins().map((origin) => new URL(origin).hostname)
    );
    const allowed =
      target.protocol === "https:" &&
      catalogHosts.has(target.hostname) &&
      target.pathname.startsWith("/wp-content/uploads/");
    if (!allowed) return new Response("Image URL is not allowed.", { status: 403 });

    const response = await fetch(target, {
      redirect: "error",
      next: { revalidate: 86400 },
    });
    if (!response.ok) return new Response("Image unavailable.", { status: 502 });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new Response("Unsupported image type.", { status: 415 });
    }

    const image = await response.arrayBuffer();
    if (image.byteLength > MAX_IMAGE_BYTES) {
      return new Response("Image is too large.", { status: 413 });
    }

    const optimized = await sharp(Buffer.from(image))
      .rotate()
      .resize(240, 240, { fit: "cover", position: "centre" })
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();

    const cacheHeaders = {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    };

    if (wantsImageResponse) {
      return new Response(optimized, {
        headers: {
          ...cacheHeaders,
          "Content-Type": "image/png",
        },
      });
    }

    return Response.json(
      {
        format: "PNG",
        base64: optimized.toString("base64"),
      },
      { headers: cacheHeaders }
    );
  } catch (error) {
    console.error("GET /api/catalog/image failed:", error);
    return new Response("Image unavailable.", { status: 502 });
  }
}
