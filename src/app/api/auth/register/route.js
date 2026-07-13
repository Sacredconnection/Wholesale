import {
  createCustomer,
  isWooCommerceConfigured,
  WooCommerceApiError,
} from "@/lib/woocommerce";
import { setWpUserRole } from "@/lib/wp-auth";
import { mapCustomerToUser, toWcAddress } from "@/lib/wc-mappers";

// Creates the wholesale account as a WooCommerce customer (a real WordPress
// user), so the buyer can immediately sign in with the same credentials.
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

  const {
    email,
    password,
    firstName = "",
    lastName = "",
    company = "",
    phone = "",
    businessType = "",
    shippingAddress = {},
    billingAddress = {},
  } = body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "A valid email address is required." }, { status: 400 });
  }
  if (!password || password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const customer = await createCustomer({
      email,
      username: email,
      password,
      first_name: firstName,
      last_name: lastName,
      billing: {
        first_name: firstName,
        last_name: lastName,
        company,
        email,
        phone,
        ...toWcAddress(billingAddress),
      },
      shipping: {
        first_name: firstName,
        last_name: lastName,
        company,
        ...toWcAddress(shippingAddress),
      },
      meta_data: [
        { key: "sc_channel", value: "wholesale-portal" },
        { key: "sc_approval_status", value: "pending" },
        ...(businessType ? [{ key: "sc_business_type", value: businessType }] : []),
      ],
    });

    // New accounts await approval: switch the role to "pending" so the team
    // sees it in WP Admin (the WC customers API always creates as "customer"
    // — its role field is read-only, so this goes through wp/v2/users). If
    // the app-password env vars are missing this is a no-op; the login route
    // blocks plain "customer" accounts as pending either way.
    await setWpUserRole(customer.id, "pending");

    return Response.json({ user: mapCustomerToUser(customer) }, { status: 201 });
  } catch (err) {
    if (err instanceof WooCommerceApiError) {
      const code = err.details?.code || "";
      if (code.includes("email-exists") || code.includes("username-exists")) {
        return Response.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 409 }
        );
      }
      if (err.details?.message) {
        console.error("POST /api/auth/register rejected:", err.details);
        return Response.json(
          { error: `Registration failed: ${err.details.message}` },
          { status: 422 }
        );
      }
    }
    console.error("POST /api/auth/register failed:", err);
    return Response.json(
      { error: "Registration failed. Please try again." },
      { status: 502 }
    );
  }
}
