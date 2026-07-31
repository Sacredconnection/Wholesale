import { isSameOrigin, securityError } from "@/lib/request-security";
import { deleteSession } from "@/lib/session";
import {
  clearLocalDevUpstreamSession,
  isLocalDevUpstreamEnabled,
  proxyLocalDevUpstream,
} from "@/lib/local-dev-upstream";

export async function POST(request) {
  if (!isSameOrigin(request)) return securityError("Cross-origin request rejected.", 403);
  if (isLocalDevUpstreamEnabled()) {
    try {
      const response = await proxyLocalDevUpstream(request, {
        clearSession: true,
      });
      await deleteSession();
      return response;
    } catch (err) {
      console.error("POST /api/auth/logout local upstream failed:", err);
      await clearLocalDevUpstreamSession();
      await deleteSession();
      return securityError("The local sign-out bridge is unavailable.", 502);
    }
  }
  await deleteSession();
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
