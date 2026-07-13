// Server-side WordPress credential verification.
// The backend has no JWT plugin, but XML-RPC is enabled — wp.getUsersBlogs
// runs wp_authenticate (accepts email or username) and needs no extra setup.

if (typeof window !== "undefined") {
  throw new Error("src/lib/wp-auth.js is server-only.");
}

const xmlEscape = (value) =>
  String(value).replace(/[<>&'"]/g, (c) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;",
  })[c]);

/**
 * Sets a WordPress user's role via the wp/v2 users API. Needs an admin
 * Application Password (WP Admin → Users → Profile → Application Passwords)
 * in WP_ADMIN_USER / WP_APP_PASSWORD. Returns false (without throwing) when
 * those env vars are absent or the call fails — callers treat it as optional.
 */
export async function setWpUserRole(userId, role) {
  const base = (process.env.WOOCOMMERCE_URL || "").replace(/\/+$/, "");
  const adminUser = process.env.WP_ADMIN_USER;
  const appPassword = process.env.WP_APP_PASSWORD;
  if (!base || !adminUser || !appPassword) return false;

  try {
    const res = await fetch(`${base}/wp-json/wp/v2/users/${userId}`, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${adminUser}:${appPassword}`).toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roles: [role] }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`setWpUserRole(${userId}, ${role}) failed with HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`setWpUserRole(${userId}, ${role}) failed:`, err);
    return false;
  }
}

/**
 * Returns { valid: boolean }. Throws on transport/unexpected responses so the
 * caller can distinguish "wrong password" from "backend unreachable".
 */
export async function verifyWpCredentials(usernameOrEmail, password) {
  const base = (process.env.WOOCOMMERCE_URL || "").replace(/\/+$/, "");
  if (!base) throw new Error("WOOCOMMERCE_URL is not configured.");

  const body =
    `<?xml version="1.0"?><methodCall><methodName>wp.getUsersBlogs</methodName><params>` +
    `<param><value><string>${xmlEscape(usernameOrEmail)}</string></value></param>` +
    `<param><value><string>${xmlEscape(password)}</string></value></param>` +
    `</params></methodCall>`;

  const res = await fetch(`${base}/xmlrpc.php`, {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`XML-RPC endpoint responded with HTTP ${res.status}.`);
  }
  if (text.includes("<fault>")) return { valid: false };
  if (text.includes("<methodResponse>")) return { valid: true };
  throw new Error("Unexpected XML-RPC response from the WordPress backend.");
}
