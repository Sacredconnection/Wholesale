import { getCustomerByEmail, isWooCommerceConfigured } from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer, mapCustomerToUser } from "@/lib/wc-mappers";
import { deleteSession, getSession } from "@/lib/session";
import { securityError } from "@/lib/request-security";
import { enforceRateLimit, rateLimitIdentity } from "@/lib/abuse-protection";

export async function GET(request) {
  const rateLimit = await enforceRateLimit(request, {
    namespace: "auth-session",
    limit: 120,
    windowSeconds: 60,
    identity: rateLimitIdentity(request),
  });
  if (rateLimit) return rateLimit;
  const session = await getSession();
  if (!session) {
    return Response.json(
      { user: null },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  }
  if (!isWooCommerceConfigured()) return securityError("Sign-in service unavailable.", 503);

  try {
    const customer = await getCustomerByEmail(session.email);
    if (
      !isApprovedWholesaleCustomer(customer) ||
      customer.id !== session.customerId ||
      (customer.email || "").toLowerCase() !== session.email
    ) {
      await deleteSession();
      return securityError("Authentication required.", 401);
    }
    return Response.json(
      { user: mapCustomerToUser(customer) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    console.error("GET /api/auth/session failed:", err);
    return securityError("Sign-in service unavailable.", 502);
  }
}
