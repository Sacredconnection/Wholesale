import { getSession } from "@/lib/session";
import { getCustomerByEmail, getProductById, isWooCommerceConfigured, updateCustomerMeta } from "@/lib/woocommerce";
import { isApprovedWholesaleCustomer, isAdminCustomer } from "@/lib/wc-mappers";
import { isSameOrigin, readJsonBody, RequestBodyError, securityError } from "@/lib/request-security";
import { enforceRateLimit, rateLimitIdentity } from "@/lib/abuse-protection";
import { readShelfIds, SHELF_LIMIT, SHELF_META_PREFIX } from "@/lib/shelf";

export const dynamic = "force-dynamic";

async function customerForSession() {
  const session = await getSession();
  if (!session) return null;
  const customer = await getCustomerByEmail(session.email);
  return isApprovedWholesaleCustomer(customer) && customer.id === session.customerId && customer.email?.toLowerCase() === session.email ? customer : null;
}
const respond = (customer) => Response.json({ productIds: readShelfIds(customer.meta_data) }, { headers: { "Cache-Control": "no-store" } });

export async function GET() {
  if (!isWooCommerceConfigured()) return securityError("Account service unavailable.", 503);
  try {
    const customer = await customerForSession();
    return customer ? respond(customer) : securityError("Authentication required.", 401);
  } catch {
    return securityError("Your shelf could not be loaded. Please try again.", 502);
  }
}

export async function PATCH(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  const rateLimit = await enforceRateLimit(request, { namespace: "account-shelf", limit: 90, windowSeconds: 60, identity: rateLimitIdentity(request) });
  if (rateLimit) return rateLimit;
  if (!isWooCommerceConfigured()) return securityError("Account service unavailable.", 503);
  try {
    const customer = await customerForSession();
    if (!customer) return securityError("Authentication required.", 401);
    const body = await readJsonBody(request, 2048);
    if (!Number.isSafeInteger(body?.productId) || body.productId <= 0 || typeof body.saved !== "boolean") return securityError("Invalid shelf selection.", 400);
    const saved = readShelfIds(customer.meta_data);
    if (body.saved && !saved.includes(body.productId)) {
      if (saved.length >= SHELF_LIMIT) return securityError(`Your shelf can hold up to ${SHELF_LIMIT} varieties. Remove one before adding another.`, 422);
      const product = await getProductById(body.productId);
      if (!product || (product.status !== "publish" && !(product.status === "private" && isAdminCustomer(customer)))) return securityError("This product is not available to save.", 404);
    }
    // Each product has its own metadata key: concurrent saves of different
    // varieties do not overwrite the customer's entire collection.
    const updated = await updateCustomerMeta(customer, { [`${SHELF_META_PREFIX}${body.productId}`]: body.saved });
    return respond(updated);
  } catch (error) {
    if (error instanceof RequestBodyError) return securityError(error.message, error.status);
    return securityError("Your shelf could not be updated. Please try again.", 502);
  }
}
