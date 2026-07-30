import "server-only";

export const SITE_URL = (
  process.env.PORTAL_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://wholesale.sacred-snuff.com"
).replace(/\/+$/, "");
