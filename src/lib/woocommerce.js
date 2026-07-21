import { getCommerceStore, isCommerceStoreConfigured, PRIMARY_STORE_ID } from "@/lib/commerce-stores";

// Server-side WooCommerce REST API client.
// Credentials are read from env vars and never reach the browser — only import
// this module from Route Handlers (src/app/api/*) or Server Components.

if (typeof window !== "undefined") {
  throw new Error(
    "src/lib/woocommerce.js is server-only. Client components must fetch /api/* routes instead."
  );
}

const API_VERSION = "wc/v3";

export function getWooCommerceBaseUrl(storeId = PRIMARY_STORE_ID) {
  return getCommerceStore(storeId).baseUrl;
}

export function isWooCommerceConfigured(storeId = PRIMARY_STORE_ID) {
  return isCommerceStoreConfigured(storeId);
}

const requestTimeoutMs = () => {
  const n = Number(process.env.WC_REQUEST_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 1000 ? n : 15000;
};

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
async function wcFetch(storeId, path, { params = {}, method = "GET", body, revalidate } = {}) {
  if (!isWooCommerceConfigured(storeId)) {
    throw new WooCommerceApiError(
      `WooCommerce store ${storeId} is not configured.`,
      0
    );
  }

  const store = getCommerceStore(storeId);
  const url = new URL(`${store.baseUrl}/wp-json/${API_VERSION}/${path.replace(/^\/+/, "")}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  });

  const auth = Buffer.from(
    `${store.consumerKey}:${store.consumerSecret}`
  ).toString("base64");

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(requestTimeoutMs()),
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

export async function getAllProducts(storeId = PRIMARY_STORE_ID) {
  const products = [];
  let page = 1;
  for (;;) {
    const { data, headers } = await wcFetch(storeId, "products", {
      params: {
        per_page: 100,
        page,
        status: "publish",
        _fields: "id,slug,name,sku,type,price,weight,images,short_description,description,featured,tags,categories,attributes,meta_data",
      },
    });
    products.push(...data);
    const totalPages = Number(headers.get("x-wp-totalpages") || 1);
    if (page >= totalPages) break;
    page += 1;
  }
  return products;
}

export async function getProductBySlug(slug, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "products", { params: { slug, status: "publish" } });
  return data[0] || null;
}

export async function getProductVariations(productId, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, `products/${productId}/variations`, {
    params: {
      per_page: 100,
      _fields: "id,name,sku,price,weight,purchasable,attributes,meta_data",
    },
  });
  return data;
}

// SKU lookup matches both products and variations (variations come back with
// type "variation" and a parent_id). Uncached — used while creating orders.
export async function findProductBySku(sku, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "products", { params: { sku }, revalidate: 0 });
  return data[0] || null;
}

export async function getProductById(productId, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, `products/${productId}`, { revalidate: 0 });
  return data;
}

export async function getVariationById(productId, variationId, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, `products/${productId}/variations/${variationId}`, {
    revalidate: 0,
  });
  return data;
}

export async function getCategories(storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "products/categories", {
    params: { per_page: 100, hide_empty: true, _fields: "id,name,parent" },
  });
  return data;
}

// ── Customers ───────────────────────────────────────────────────────

export async function createCustomer(customer, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "customers", { method: "POST", body: customer });
  return data;
}

export async function getCustomerByEmail(email, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "customers", {
    params: { email, role: "all", per_page: 10 },
    revalidate: 0,
  });
  return (
    data.find((c) => (c.email || "").toLowerCase() === email.toLowerCase()) || null
  );
}

// ── Orders ──────────────────────────────────────────────────────────

export async function createOrder(order, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "orders", { method: "POST", body: order });
  return data;
}

// WC core has no billing-email filter, so search by the email and then keep
// only exact billing matches. Uncached so new orders show up immediately.
export async function getOrdersByEmail(email, storeId = PRIMARY_STORE_ID) {
  const { data } = await wcFetch(storeId, "orders", {
    params: { search: email, per_page: 50, orderby: "date", order: "desc" },
    revalidate: 0,
  });
  return data.filter(
    (order) => (order.billing?.email || "").toLowerCase() === email.toLowerCase()
  );
}
