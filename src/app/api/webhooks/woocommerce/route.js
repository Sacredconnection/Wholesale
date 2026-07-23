import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { getRequiredCommerceStores } from "@/lib/commerce-stores";
import { getWooCommerceCatalogCacheTag } from "@/lib/woocommerce";

export const runtime = "nodejs";

const PRODUCT_TOPICS = new Set([
  "product.created",
  "product.updated",
  "product.deleted",
  "product.restored",
]);

function hasValidSignature(body, signature, secret) {
  if (!signature || !secret) return false;

  const expected = createHmac("sha256", secret).update(body).digest();
  let received;
  try {
    received = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request) {
  const secret = process.env.WC_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json(
      { error: "WooCommerce webhook is not configured." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const body = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("x-wc-webhook-signature");
  if (!hasValidSignature(body, signature, secret)) {
    return Response.json(
      { error: "Invalid webhook signature." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const topic = request.headers.get("x-wc-webhook-topic") || "";
  if (!PRODUCT_TOPICS.has(topic)) {
    return Response.json(
      { accepted: true, revalidated: false, topic },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  getRequiredCommerceStores().forEach((store) => {
    revalidateTag(getWooCommerceCatalogCacheTag(store.id), { expire: 0 });
  });
  revalidateTag("woocommerce-catalog", { expire: 0 });
  return Response.json(
    { accepted: true, revalidated: true, topic },
    { headers: { "Cache-Control": "no-store" } }
  );
}
