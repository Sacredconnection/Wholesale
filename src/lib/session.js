import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const LEGACY_COOKIE_NAME = "sc_wholesale_session";
const COOKIE_NAME =
  process.env.NODE_ENV === "production"
    ? "__Host-sc_wholesale_session"
    : LEGACY_COOKIE_NAME;
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const MAX_SESSION_COOKIE_LENGTH = 4096;

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(encodedPayload) {
  return createHmac("sha256", sessionSecret()).update(encodedPayload).digest("base64url");
}

function encodeSession(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function decodeSession(value) {
  if (
    !value ||
    typeof value !== "string" ||
    value.length > MAX_SESSION_COOKIE_LENGTH
  ) {
    return null;
  }

  const [encodedPayload, suppliedSignature, extra] = value.split(".");
  if (!encodedPayload || !suppliedSignature || extra) return null;

  const expectedSignature = sign(encodedPayload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (
      typeof payload.email !== "string" ||
      payload.email.length > 254 ||
      !Number.isInteger(payload.customerId) ||
      payload.customerId <= 0 ||
      !Number.isInteger(payload.expiresAt) ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function createSession({ email, customerId }) {
  if (!Number.isInteger(customerId) || customerId <= 0) {
    throw new Error("A valid customer ID is required to create a session.");
  }
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const value = encodeSession({
    email: email.toLowerCase(),
    customerId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    priority: "high",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  return decodeSession(cookieStore.get(COOKIE_NAME)?.value);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  if (COOKIE_NAME !== LEGACY_COOKIE_NAME) {
    cookieStore.delete(LEGACY_COOKIE_NAME);
  }
}
