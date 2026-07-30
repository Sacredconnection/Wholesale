import "server-only";

import { createHash } from "node:crypto";
import { isIP } from "node:net";

const MAX_LOCAL_ENTRIES = 10_000;
const localRateLimits = new Map();
const localIdempotency = new Map();
let redisUnavailableUntil = 0;
let lastRedisFailureLogAt = 0;

const IDEMPOTENCY_PROCESSING_SECONDS = 15 * 60;
const IDEMPOTENCY_COMPLETED_SECONDS = 24 * 60 * 60;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

const RATE_LIMIT_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return { count, redis.call("TTL", KEYS[1]) }
`;

function hashValue(value) {
  return createHash("sha256").update(String(value)).digest("base64url").slice(0, 36);
}

function redisConfiguration() {
  const rawUrl =
    process.env.RATE_LIMIT_REDIS_REST_URL ||
    process.env.RATE_LIMIT_REDIS_REST_KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL;
  const token =
    process.env.RATE_LIMIT_REDIS_REST_TOKEN ||
    process.env.RATE_LIMIT_REDIS_REST_KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN;
  if (!rawUrl || !token) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return null;
    return { url: url.href.replace(/\/+$/, ""), token };
  } catch {
    return null;
  }
}

async function redisCommand(command) {
  const config = redisConfiguration();
  if (!config) return { configured: false, result: null };
  if (Date.now() < redisUnavailableUntil) {
    return { configured: true, failed: true, result: null };
  }

  try {
    const response = await fetch(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      throw new Error(`Redis REST request failed with HTTP ${response.status}.`);
    }
    redisUnavailableUntil = 0;
    return { configured: true, result: payload.result };
  } catch (error) {
    const now = Date.now();
    redisUnavailableUntil = now + 30_000;
    if (now - lastRedisFailureLogAt >= 60_000) {
      lastRedisFailureLogAt = now;
      console.error("Distributed abuse protection unavailable; using local fallback:", error);
    }
    return { configured: true, failed: true, result: null };
  }
}

function pruneLocalStore(store, now = Date.now()) {
  for (const [key, value] of store) {
    if (value.expiresAt <= now) store.delete(key);
  }
  while (store.size >= MAX_LOCAL_ENTRIES) {
    store.delete(store.keys().next().value);
  }
}

function requestAddress(request) {
  const forwarded =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  const candidate = forwarded.split(",", 1)[0].trim();
  if (isIP(candidate)) return candidate;

  const userAgent = request.headers.get("user-agent") || "unknown";
  return `unknown:${userAgent.slice(0, 160)}`;
}

export function rateLimitIdentity(request, secondary = "") {
  return `${requestAddress(request)}:${String(secondary).trim().toLowerCase()}`;
}

function localRateLimit(key, windowSeconds) {
  const now = Date.now();
  pruneLocalStore(localRateLimits, now);

  const current = localRateLimits.get(key);
  const entry =
    current && current.expiresAt > now
      ? current
      : { count: 0, expiresAt: now + windowSeconds * 1_000 };
  entry.count += 1;
  localRateLimits.set(key, entry);

  return {
    count: entry.count,
    retryAfter: Math.max(1, Math.ceil((entry.expiresAt - now) / 1_000)),
  };
}

async function rateLimitResult(key, limit, windowSeconds) {
  const remote = await redisCommand([
    "EVAL",
    RATE_LIMIT_SCRIPT,
    "1",
    key,
    String(windowSeconds),
  ]);
  if (remote.configured && !remote.failed && Array.isArray(remote.result)) {
    return {
      count: Number(remote.result[0]) || 1,
      retryAfter: Math.max(1, Number(remote.result[1]) || windowSeconds),
    };
  }
  return localRateLimit(key, windowSeconds);
}

export async function enforceRateLimit(
  request,
  { namespace, limit, windowSeconds, identity = rateLimitIdentity(request) }
) {
  const key = `sacred:rate:${namespace}:${hashValue(identity)}`;
  const result = await rateLimitResult(key, limit, windowSeconds);
  if (result.count <= limit) return null;

  return Response.json(
    { error: "Too many requests. Please wait and try again." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(result.retryAfter),
        "RateLimit-Limit": String(limit),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(result.retryAfter),
      },
    }
  );
}

function parseCompletedIdempotency(value) {
  if (typeof value !== "string" || !value.startsWith("completed:")) return null;
  try {
    const parsed = JSON.parse(value.slice("completed:".length));
    if (
      !Number.isInteger(parsed.status) ||
      parsed.status < 200 ||
      parsed.status > 599 ||
      !parsed.body ||
      typeof parsed.body !== "object"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function localReserveIdempotency(key) {
  const now = Date.now();
  pruneLocalStore(localIdempotency, now);
  const existing = localIdempotency.get(key);
  if (existing?.expiresAt > now) {
    return {
      state: existing.state,
      completed: existing.completed || null,
      handle: { backend: "local", key },
    };
  }
  localIdempotency.set(key, {
    state: "processing",
    expiresAt: now + IDEMPOTENCY_PROCESSING_SECONDS * 1_000,
  });
  return { state: "acquired", handle: { backend: "local", key } };
}

export function readIdempotencyKey(request) {
  const value = request.headers.get("idempotency-key")?.trim() || "";
  return IDEMPOTENCY_KEY_PATTERN.test(value) ? value : null;
}

export async function reserveIdempotency({ namespace, identity, key }) {
  const storageKey = `sacred:idempotency:${namespace}:${hashValue(`${identity}:${key}`)}`;
  const localReservation = localReserveIdempotency(storageKey);
  if (localReservation.state !== "acquired") return localReservation;

  const remote = await redisCommand([
    "SET",
    storageKey,
    "processing",
    "NX",
    "EX",
    String(IDEMPOTENCY_PROCESSING_SECONDS),
  ]);

  if (remote.configured && !remote.failed) {
    const handle = { backend: "redis", key: storageKey };
    if (remote.result === "OK") return { state: "acquired", handle };

    const existing = await redisCommand(["GET", storageKey]);
    if (existing.failed) {
      return {
        state: "processing",
        handle: { backend: "local", key: storageKey },
      };
    }
    localIdempotency.delete(storageKey);
    const completed = parseCompletedIdempotency(existing.result);
    return completed
      ? { state: "completed", completed, handle }
      : { state: "processing", handle };
  }

  return localReservation;
}

export async function completeIdempotency(handle, { status, body }) {
  const completed = { status, body };
  const value = `completed:${JSON.stringify(completed)}`;
  if (handle.backend === "redis") {
    await redisCommand([
      "SET",
      handle.key,
      value,
      "EX",
      String(IDEMPOTENCY_COMPLETED_SECONDS),
    ]);
  }

  pruneLocalStore(localIdempotency);
  localIdempotency.set(handle.key, {
    state: "completed",
    completed,
    expiresAt: Date.now() + IDEMPOTENCY_COMPLETED_SECONDS * 1_000,
  });
}

export async function releaseIdempotency(handle) {
  if (!handle) return;
  if (handle.backend === "redis") {
    await redisCommand(["DEL", handle.key]);
  }
  localIdempotency.delete(handle.key);
}
