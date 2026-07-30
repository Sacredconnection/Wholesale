import { getCommerceStoreOrigins } from "@/lib/commerce-stores";
import { enforceRateLimit, rateLimitIdentity } from "@/lib/abuse-protection";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const decodeLegacyUtf8Sequence = (sequence) =>
  Buffer.from(
    Array.from(sequence, (character) => character.charCodeAt(0))
  ).toString("utf8");

const repairLegacyUtf8Url = (value) =>
  String(value || "")
    .replace(
      /[\u00f0-\u00f4][\u0080-\u00bf]{3}/g,
      decodeLegacyUtf8Sequence
    )
    .replace(
      /[\u00e0-\u00ef][\u0080-\u00bf]{2}/g,
      decodeLegacyUtf8Sequence
    )
    .replace(
      /[\u00c2-\u00df][\u0080-\u00bf]/g,
      decodeLegacyUtf8Sequence
    );

async function readLimitedResponseBody(response) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
    throw new RangeError("Image is too large.");
  }
  if (!response.body) throw new Error("Image response has no body.");

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_IMAGE_BYTES) {
      await reader.cancel();
      throw new RangeError("Image is too large.");
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks, totalBytes);
}

export async function GET(request) {
  try {
    const rateLimit = await enforceRateLimit(request, {
      namespace: "catalog-image",
      limit: 90,
      windowSeconds: 60,
      identity: rateLimitIdentity(request),
    });
    if (rateLimit) return rateLimit;

    const { searchParams } = new URL(request.url);
    const source = searchParams.get("url");
    const wantsImageResponse = searchParams.get("format") === "image";
    if (!source) return new Response("Missing image URL.", { status: 400 });
    if (source.length > 2048) return new Response("Image URL is too long.", { status: 400 });

    let target;
    try {
      target = new URL(repairLegacyUtf8Url(source));
    } catch {
      return new Response("Invalid image URL.", { status: 400 });
    }
    const catalogOrigins = new Set(getCommerceStoreOrigins());
    const allowed =
      target.protocol === "https:" &&
      !target.username &&
      !target.password &&
      catalogOrigins.has(target.origin) &&
      target.pathname.startsWith("/wp-content/uploads/");
    if (!allowed) return new Response("Image URL is not allowed.", { status: 403 });

    const response = await fetch(target, {
      redirect: "error",
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return new Response("Image unavailable.", { status: 502 });

    const contentType = (response.headers.get("content-type") || "")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return new Response("Unsupported image type.", { status: 415 });
    }

    const image = await readLimitedResponseBody(response);

    const optimized = await sharp(image, {
      failOn: "warning",
      limitInputPixels: 25_000_000,
    })
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
    if (error instanceof RangeError) {
      return new Response("Image is too large.", { status: 413 });
    }
    console.error("GET /api/catalog/image failed:", error);
    return new Response("Image unavailable.", { status: 502 });
  }
}
