import "server-only";

import { cookies } from "next/headers";

const LOCAL_SESSION_COOKIE = "sc_wholesale_upstream_session";
const UPSTREAM_SESSION_COOKIE = "__Host-sc_wholesale_session";
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const MAX_SESSION_LENGTH = 4096;

function configuredOrigin() {
  if (process.env.NODE_ENV === "production") return null;

  const configured = (process.env.LOCAL_API_PROXY_ORIGIN || "").trim();
  if (!configured) return null;

  const url = new URL(configured);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "LOCAL_API_PROXY_ORIGIN must be an HTTPS origin without a path, query, or credentials."
    );
  }
  return url.origin;
}

export function isLocalDevUpstreamEnabled() {
  return Boolean(configuredOrigin());
}

export function getLocalDevUpstreamOrigin() {
  return configuredOrigin();
}

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function upstreamSessionFromHeaders(headers) {
  const values =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : [headers.get("set-cookie")].filter(Boolean);
  const pattern = new RegExp(
    `(?:^|,\\s*)${escapeRegExp(UPSTREAM_SESSION_COOKIE)}=([^;]+)`
  );

  for (const value of values) {
    const match = value.match(pattern);
    if (match?.[1] && match[1].length <= MAX_SESSION_LENGTH) return match[1];
  }
  return null;
}

async function upstreamSession() {
  return (await cookies()).get(LOCAL_SESSION_COOKIE)?.value || "";
}

async function saveUpstreamSession(value) {
  if (!value || value.length > MAX_SESSION_LENGTH) {
    throw new Error("The upstream session cookie is missing or invalid.");
  }
  (await cookies()).set(LOCAL_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    priority: "high",
  });
}

export async function clearLocalDevUpstreamSession() {
  (await cookies()).delete(LOCAL_SESSION_COOKIE);
}

function responseHeaders(upstream) {
  const headers = new Headers();
  [
    "cache-control",
    "content-disposition",
    "content-type",
    "etag",
    "last-modified",
  ].forEach((name) => {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  });
  headers.set("X-Local-Dev-Upstream", "1");
  return headers;
}

export async function proxyLocalDevUpstream(
  request,
  {
    path,
    method = request.method,
    body,
    includeSession = true,
    persistSession = false,
    clearSession = false,
  } = {}
) {
  const origin = configuredOrigin();
  if (!origin) throw new Error("The local development upstream is not configured.");

  const requestUrl = new URL(request.url);
  const target = new URL(path || `${requestUrl.pathname}${requestUrl.search}`, origin);
  if (target.origin !== origin || !target.pathname.startsWith("/api/")) {
    throw new Error("Only same-origin API routes can use the local development upstream.");
  }

  const headers = new Headers({
    Accept: request.headers.get("accept") || "*/*",
    Origin: origin,
  });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers.set("Idempotency-Key", idempotencyKey);

  if (includeSession) {
    const session = await upstreamSession();
    if (session) {
      headers.set("Cookie", `${UPSTREAM_SESSION_COOKIE}=${session}`);
    }
  }

  const upstream = await fetch(target, {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(60_000),
  });

  if (persistSession && upstream.ok) {
    const session = upstreamSessionFromHeaders(upstream.headers);
    await saveUpstreamSession(session);
  }
  if (clearSession || upstream.status === 401) {
    await clearLocalDevUpstreamSession();
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders(upstream),
  });
}
