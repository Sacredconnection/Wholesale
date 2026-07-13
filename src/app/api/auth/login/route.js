import { verifyWpCredentials } from "@/lib/wp-auth";
import { getCustomerByEmail, isWooCommerceConfigured } from "@/lib/woocommerce";
import { mapCustomerToUser, fromWcAddress } from "@/lib/wc-mappers";

// Verifies WordPress credentials (email or username + password) and returns
// the wholesale user profile built from the WooCommerce customer record.
export async function POST(request) {
  if (!isWooCommerceConfigured()) {
    return Response.json(
      { error: "WooCommerce backend is not configured." },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return Response.json({ error: "Email and password are required." }, { status: 400 });
  }

  const PENDING_ROLES = ["pending", "customer"];
  const pendingResponse = () =>
    Response.json(
      {
        error:
          "Your wholesale account is pending approval by the administration. You will be able to sign in once your access level is assigned.",
      },
      { status: 403 }
    );

  try {
    const { valid } = await verifyWpCredentials(email, password);
    if (!valid) {
      // WordPress itself refuses to authenticate accounts in the "pending"
      // role (it reports them as bad credentials) — surface the real reason.
      const maybePending = email.includes("@") ? await getCustomerByEmail(email) : null;
      if (maybePending && PENDING_ROLES.includes((maybePending.role || "").toLowerCase())) {
        return pendingResponse();
      }
      return Response.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Credentials are valid — enrich the session with the WC customer profile.
    // A valid WP user without a customer record (e.g. shop staff) still gets
    // a minimal profile so they can browse the portal.
    const customer = email.includes("@") ? await getCustomerByEmail(email) : null;

    // Accounts awaiting approval cannot sign in until the team assigns an
    // access level (New/Special/Old Customer) in WP Admin.
    if (customer && PENDING_ROLES.includes((customer.role || "").toLowerCase())) {
      return pendingResponse();
    }
    const user = customer
      ? mapCustomerToUser(customer)
      : {
          firstName: "",
          lastName: "",
          displayName: email,
          email: email.includes("@") ? email : "",
          company: "",
          phone: "",
          country: "",
          accountId: null,
          wcCustomerId: null,
          status: "ACTIVE",
          creditLimit: 0,
          discountRate: 0,
          avatar: null,
          isAdmin: false,
          shippingAddress: fromWcAddress(),
          billingAddress: fromWcAddress(),
        };

    return Response.json({ user });
  } catch (err) {
    console.error("POST /api/auth/login failed:", err);
    return Response.json(
      { error: "Could not reach the authentication backend. Please try again." },
      { status: 502 }
    );
  }
}
