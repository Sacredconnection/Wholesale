import { verifyWpCredentials } from "@/lib/wp-auth";
import { getCustomerByEmail, isWooCommerceConfigured } from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer, mapCustomerToUser } from "@/lib/wc-mappers";
import { enforceRateLimit, rateLimitIdentity } from "@/lib/abuse-protection";
import {
  cleanText,
  isSameOrigin,
  isValidEmail,
  readJsonBody,
  RequestBodyError,
  securityError,
} from "@/lib/request-security";
import { createSession } from "@/lib/session";
import {
  isLocalDevUpstreamEnabled,
  proxyLocalDevUpstream,
} from "@/lib/local-dev-upstream";

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const ipLimit = await enforceRateLimit(request, {
    namespace: "auth-login-ip",
    limit: 10,
    windowSeconds: 15 * 60,
  });
  if (ipLimit) return ipLimit;
  let body;
  try {
    body = await readJsonBody(request, 8 * 1024);
  } catch (err) {
    if (err instanceof RequestBodyError) return securityError(err.message, err.status);
    return securityError("Invalid JSON body.", 400);
  }

  const email = cleanText(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidEmail(email) || !password || password.length > 256) {
    return securityError("A valid email and password are required.", 400);
  }
  const accountLimit = await enforceRateLimit(request, {
    namespace: "auth-login-account",
    limit: 6,
    windowSeconds: 15 * 60,
    identity: email,
  });
  if (accountLimit) return accountLimit;

  if (isLocalDevUpstreamEnabled()) {
    try {
      return await proxyLocalDevUpstream(request, {
        body: JSON.stringify({ email, password }),
        persistSession: true,
      });
    } catch (err) {
      console.error("POST /api/auth/login local upstream failed:", err);
      return securityError("The local sign-in bridge is unavailable.", 502);
    }
  }

  if (!isWooCommerceConfigured()) return securityError("Sign-in service unavailable.", 503);

  let authenticationStage = "WordPress credential verification";
  try {
    const { valid } = await verifyWpCredentials(email, password);
    if (!valid) return securityError("Invalid email or password.", 401);

    authenticationStage = "WooCommerce customer lookup";
    const customer = await getCustomerByEmail(email);
    if (!isApprovedWholesaleCustomer(customer)) {
      return securityError(
        "Your wholesale account is pending approval by the administration.",
        403
      );
    }

    const user = mapCustomerToUser(customer);
    authenticationStage = "session creation";
    await createSession({ email: user.email, customerId: customer.id });
    return Response.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(`POST /api/auth/login failed during ${authenticationStage}:`, err);
    return securityError("The sign-in service is unavailable. Please try again.", 502);
  }
}
