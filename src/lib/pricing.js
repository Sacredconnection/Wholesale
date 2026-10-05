// Client-safe pricing helpers (no secrets here). Also imported server-side by
// /api/orders so the order totals use exactly the same rules as the UI.

// Minimum wholesale order value in USD. The storefront uses USD throughout,
// and the same threshold is enforced again when an order is registered.
export const MIN_ORDER_AMOUNT = 500;
export const MAX_ORDER_ITEM_QUANTITY = 1000;

// Some approved accounts use a weight-based order minimum instead of the
// standard dollar minimum. The server adds `minimumOrderWeightGrams` to those
// users; keeping the evaluator here makes the cart, checkout, suggestions, and
// order API follow the same rule.
export function orderMinimumStatus(user, totalAmount, totalWeightGrams) {
  const minimumWeightGrams = Number(user?.minimumOrderWeightGrams);
  const usesWeightMinimum =
    Number.isFinite(minimumWeightGrams) && minimumWeightGrams > 0;
  const required = usesWeightMinimum
    ? minimumWeightGrams
    : MIN_ORDER_AMOUNT;
  const current = usesWeightMinimum
    ? Math.max(0, Number(totalWeightGrams) || 0)
    : Math.max(0, Number(totalAmount) || 0);

  return {
    type: usesWeightMinimum ? "weight" : "amount",
    required,
    current,
    remaining: Math.max(0, required - current),
    meetsMinimum: current >= required,
  };
}

// Small tins are packed in wholesale cases. Quantities must follow these
// increments everywhere: product controls, cart updates, suggestions, and API.
export function quantityStepForWeight(weightGrams) {
  const weight = Math.round(Number(weightGrams) || 0);
  if (weight === 5 || weight === 10) return 10;
  if (weight === 20 || weight === 50) return 5;
  return 1;
}

// Current stock that can fill complete wholesale packs. This is availability
// information only: the portal also accepts order requests for the next
// restock, so callers must not use this value as a purchasing limit.
export function orderableStockQuantity(option) {
  if (!option) return null;
  if (option.stockQuantity == null || option.stockQuantity === "") return null;
  const stockQuantity = Number(option.stockQuantity);
  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) return null;
  const quantityStep = quantityStepForWeight(option.weightGrams);
  return Math.floor(Math.max(0, stockQuantity) / quantityStep) * quantityStep;
}

export function isOptionOrderable(option) {
  if (!option || option.inStock === false) return false;
  const orderableQuantity = orderableStockQuantity(option);
  return orderableQuantity == null || orderableQuantity > 0;
}

export function maximumOrderQuantityForWeight(weightGrams) {
  const quantityStep = quantityStepForWeight(weightGrams);
  return (
    Math.floor(MAX_ORDER_ITEM_QUANTITY / quantityStep) * quantityStep
  );
}

export function needsBackorder(option, quantity = option?.quantity) {
  if (!option) return false;
  if (option.inStock === false) return true;
  const requestedQuantity = Number(quantity);
  const availableQuantity = orderableStockQuantity(option);
  return (
    Number.isFinite(requestedQuantity) &&
    availableQuantity != null &&
    requestedQuantity > availableQuantity
  );
}

export function normalizeQuantityForWeight(quantity, weightGrams) {
  const step = quantityStepForWeight(weightGrams);
  const requested = Math.max(1, Math.floor(Number(quantity) || step));
  return Math.max(step, Math.ceil(requested / step) * step);
}

export function isValidQuantityForWeight(quantity, weightGrams) {
  const step = quantityStepForWeight(weightGrams);
  return (
    Number.isSafeInteger(quantity) &&
    quantity >= step &&
    quantity % step === 0
  );
}

// Use the WooCommerce price configured for the customer's role, or the base price.
export function optionPriceForUser(option, user) {
  if (!option) return 0;
  const rolePrice = user?.role ? option.rolePrices?.[user.role] : undefined;
  return rolePrice != null ? rolePrice : option.price || 0;
}

export function cartUnitPrice(item) {
  return item.price || 0;
}
