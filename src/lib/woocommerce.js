// Server-side WooCommerce REST API client.
// Credentials are read from env vars and never reach the browser — only import
// this module from Route Handlers (src/app/api/*) or Server Components.

if (typeof window !== "undefined") {
  throw new Error(
    "src/lib/woocommerce.js is server-only. Client components must fetch /api/* routes instead."
  );
}

const API_VERSION = "wc/v3";

const baseUrl = () => (process.env.WOOCOMMERCE_URL || "").replace(/\/+$/, "");

export function isWooCommerceConfigured() {
  return Boolean(
    process.env.WOOCOMMERCE_URL &&
      process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET
  );
}

const revalidateSeconds = () => {
  const n = Number(process.env.WC_REVALIDATE_SECONDS);
  return Number.isFinite(n) && n >= 0 ? n : 300;
};

export class WooCommerceApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "WooCommerceApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Low-level fetch against the WooCommerce REST API (Basic auth over HTTPS).
 * GET responses are cached in the Next.js data cache for WC_REVALIDATE_SECONDS.
 */
async function wcFetch(path, { params = {}, method = "GET", body, revalidate } = {}) {
  if (!isWooCommerceConfigured()) {
    throw new WooCommerceApiError(
      "WooCommerce is not configured (missing WOOCOMMERCE_URL / _CONSUMER_KEY / _CONSUMER_SECRET).",
      0
    );
  }

  const url = new URL(`${baseUrl()}/wp-json/${API_VERSION}/${path.replace(/^\/+/, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });

  const auth = Buffer.from(
    `${process.env.WOOCOMMERCE_CONSUMER_KEY}:${process.env.WOOCOMMERCE_CONSUMER_SECRET}`
  ).toString("base64");

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    ...(method === "GET"
      ? { next: { revalidate: revalidate ?? revalidateSeconds() } }
      : { cache: "no-store" }),
  });

  if (!res.ok) {
    let details;
    try {
      details = await res.json();
    } catch {
      // non-JSON error body
    }
    throw new WooCommerceApiError(
      `WooCommerce API ${method} ${path} failed with status ${res.status}`,
      res.status,
      details
    );
  }

  return { data: await res.json(), headers: res.headers };
}

// ── Catalog ─────────────────────────────────────────────────────────

export async function getAllProducts() {
  const products = [];
  let page = 1;
  for (;;) {
    const { data, headers } = await wcFetch("products", {
      params: { per_page: 100, page, status: "publish" },
    });
    products.push(...data);
    const totalPages = Number(headers.get("x-wp-totalpages") || 1);
    if (page >= totalPages) break;
    page += 1;
  }
  return products;
}

export async function getProductBySlug(slug) {
  const { data } = await wcFetch("products", { params: { slug, status: "publish" } });
  return data[0] || null;
}

export async function getProductVariations(productId) {
  const { data } = await wcFetch(`products/${productId}/variations`, {
    params: { per_page: 100 },
  });
  return data;
}

// SKU lookup matches both products and variations (variations come back with
// type "variation" and a parent_id). Uncached — used while creating orders.
export async function findProductBySku(sku) {
  const { data } = await wcFetch("products", { params: { sku }, revalidate: 0 });
  return data[0] || null;
}

export async function getProductById(productId) {
  const { data } = await wcFetch(`products/${productId}`, { revalidate: 0 });
  return data;
}

export async function getVariationById(productId, variationId) {
  const { data } = await wcFetch(`products/${productId}/variations/${variationId}`, {
    revalidate: 0,
  });
  return data;
}

export async function getCategories() {
  const { data } = await wcFetch("products/categories", {
    params: { per_page: 100, hide_empty: true },
  });
  return data;
}

// ── Customers ───────────────────────────────────────────────────────

export async function createCustomer(customer) {
  const { data } = await wcFetch("customers", { method: "POST", body: customer });
  return data;
}

export async function getCustomerByEmail(email) {
  const { data } = await wcFetch("customers", {
    params: { email, role: "all", per_page: 10 },
    revalidate: 0,
  });
  return (
    data.find((c) => (c.email || "").toLowerCase() === email.toLowerCase()) || null
  );
}

// ── Orders ──────────────────────────────────────────────────────────

export async function createOrder(order) {
  const { data } = await wcFetch("orders", { method: "POST", body: order });
  return data;
}

// WC core has no billing-email filter, so search by the email and then keep
// only exact billing matches. Uncached so new orders show up immediately.
export async function getOrdersByEmail(email) {
  const { data } = await wcFetch("orders", {
    params: { search: email, per_page: 50, orderby: "date", order: "desc" },
    revalidate: 0,
  });
  return data.filter(
    (order) => (order.billing?.email || "").toLowerCase() === email.toLowerCase()
  );
}
