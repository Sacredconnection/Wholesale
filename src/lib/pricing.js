// Client-safe pricing helpers (no secrets here). Also imported server-side by
// /api/orders so the order totals use exactly the same rules as the UI.

// Orders have no minimum value in USD. The storefront uses USD throughout,
// and the same threshold is enforced again when an order is registered.
export const MIN_ORDER_AMOUNT = 0;
export const MAX_ORDER_ITEM_QUANTITY = 1000;

// Some approved accounts use a weight-based order minimum instead of the
// default zero dollar minimum. The server adds `minimumOrderWeightGrams` to those
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

// Current stock that can fill complete wholesale packs. Unknown stock remains
// unknown; it must not be mistaken for an empty warehouse.
export function orderableStockQuantity(option) {
  if (!option) return null;
  if (option.stockQuantity == null || option.stockQuantity === "") return null;
  const stockQuantity = Number(option.stockQuantity);
  if (!Number.isFinite(stockQuantity)) return null;
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

export function isOptionVisible(option) {
  if (!option || option.lifecycle === "removed") return false;
  if (!option.stockLimited) return true;
  const stock = orderableStockQuantity(option);
  return option.inStock !== false && (stock == null || stock > 0);
}

export function getOrderableProductOptions(product) {
  if (!product || product.lifecycle === "removed") return [];
  return (product.options || []).filter(isOptionVisible);
}

export function maximumOrderQuantity(option) {
  if (!option || option.lifecycle === "removed") return 0;
  const maximum = maximumOrderQuantityForWeight(option.weightGrams);
  if (!option.stockLimited) return maximum;
  if (option.inStock === false) return 0;
  return Math.min(maximum, orderableStockQuantity(option) ?? 0);
}

export function orderQuantityError(option, quantity) {
  if (!option || option.lifecycle === "removed") return "This product is no longer available.";
  if (!isValidQuantityForWeight(quantity, option.weightGrams)) {
    return `Order in multiples of ${quantityStepForWeight(option.weightGrams)} units.`;
  }
  if (option.stockLimited && orderableStockQuantity(option) == null) {
    return "Stock must be confirmed for this discontinued format before ordering.";
  }
  const maximum = maximumOrderQuantity(option);
  if (quantity > maximum) {
    return option.stockLimited
      ? `Only ${maximum} units remain. This item cannot be ordered for restock.`
      : `The maximum quantity is ${maximum} units.`;
  }
  return "";
}

// Used at checkout and by the server. Different variations can consume the
// same parent-managed stock; SKU-only checks would allow their combined excess.
export function stockLimitErrors(items = []) {
  const stockKey = (item) => `${item.storeId || item.store?.id || "sacred-connection"}:${item.stockItemId || item.wcVariationId || item.variationId || item.wcProductId || item.productId || item.sku}`;
  const totals = new Map();
  items.forEach((item) => totals.set(stockKey(item), (totals.get(stockKey(item)) || 0) + item.quantity));
  return items.flatMap((item) => {
    const error = orderQuantityError(item, item.quantity);
    const knownStock = item.stockQuantity != null && item.stockQuantity !== "" && Number.isFinite(Number(item.stockQuantity));
    const sharedExcess = item.stockLimited && knownStock && totals.get(stockKey(item)) > Math.max(0, Number(item.stockQuantity));
    return error || sharedExcess ? [{ item, error: error || `Only ${Math.max(0, Number(item.stockQuantity))} units remain across the selected formats.` }] : [];
  });
}

export function needsBackorder(option, quantity = option?.quantity) {
  if (!option) return false;
  if (option.stockLimited || option.lifecycle === "removed") return false;
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
