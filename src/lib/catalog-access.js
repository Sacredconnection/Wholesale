import "server-only";
import { getSession } from "@/lib/session";
import { getCustomerByEmail } from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer } from "@/lib/wc-mappers";
import { securityError } from "@/lib/request-security";
import { isLocalDevUpstreamEnabled, proxyLocalDevUpstream } from "@/lib/local-dev-upstream";

export async function checkCatalogAccess(request) {
  try {
    if (isLocalDevUpstreamEnabled()) {
      const response = await proxyLocalDevUpstream(request, { path: "/api/auth/session" });
      const data = await response.json();
      return response.ok && data.user ? null : securityError("Sign in to view the catalog.", 401);
    }
    const session = await getSession();
    if (!session) return securityError("Sign in to view the catalog.", 401);
    const customer = await getCustomerByEmail(session.email);
    if (!isApprovedWholesaleCustomer(customer) || customer.id !== session.customerId || (customer.email || "").toLowerCase() !== session.email) {
      return securityError("Sign in with an approved wholesale account to view the catalog.", 401);
    }
    return null;
  } catch (error) {
    console.error("Catalog access validation failed:", error);
    return securityError("Sign-in service unavailable.", 502);
  }
}
