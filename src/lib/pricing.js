// Client-safe pricing helpers (no secrets here).

// Minimum wholesale order weight, enforced in the cart UI and re-validated
// server-side when the order is registered.
export const MIN_ORDER_GRAMS = 250;

// Effective unit price for a catalog option given the signed-in user's access
// level (WP role). Falls back to the option's base price when the user has no
// role or the option has no rule for it.
export function optionPriceForUser(option, user) {
  if (!option) return 0;
  const rolePrice = user?.role ? option.rolePrices?.[user.role] : undefined;
  return rolePrice != null ? rolePrice : option.price || 0;
}
