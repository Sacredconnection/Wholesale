import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const sourceUrl = async (name) => `data:text/javascript;base64,${Buffer.from(await readFile(new URL(`../src/lib/${name}.js`, import.meta.url), "utf8")).toString("base64")}`;
const pricing = await sourceUrl("pricing");
const taxonomy = await sourceUrl("catalog-taxonomy");
const source = (await readFile(new URL("../src/lib/order-suggestions.js", import.meta.url), "utf8"))
  .replaceAll("@/lib/pricing", pricing).replaceAll("@/lib/catalog-taxonomy", taxonomy);
const { rankHistoricalItems, isStockedOption, preferredStockedOptionIndex, ensureWholesaleMinimum, recipeScore, SUGGESTED_BLEND_RECIPES } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const item = (sku, quantity = 1) => ({ sku, quantity });
const ranked = rankHistoricalItems([
  { status: "cancelled", dateCreated: "2026-10-13", items: [item("cancelled", 100)] },
  { status: "pending", dateCreated: "2026-10-13", items: [item("pending", 100)] },
  { status: "completed", dateCreated: "2026-08-01", items: [item("old")] },
  { status: "processing", dateCreated: "2026-10-01", items: [item("recent")] },
]);
assert.deepEqual(ranked.map((entry) => entry.sku), ["recent", "old"], "Only genuine orders, sorted by recency, can inform suggestions");
assert.equal(rankHistoricalItems([]).length, 0);
assert.equal(isStockedOption({ inStock: true, weightGrams: 100, stockLimited: true, stockQuantity: null }), false, "Unconfirmed discontinued stock cannot be suggested");
assert.equal(isStockedOption({ inStock: true, weightGrams: 50, lifecycle: "removed", stockQuantity: 20 }), false);
assert.equal(isStockedOption({ inStock: false, weightGrams: 50, backordersAllowed: true }), false, "Suggestions only contain stock available now");

const product = { id: "fixture", category: "Huni Kuin", tribe: "Huni Kuin", name: "Cacau", options: [
  { sku: "retired", weightGrams: 100, inStock: false, stockLimited: true, stockQuantity: 0, price: 20 },
  { sku: "current", weightGrams: 50, inStock: true, stockQuantity: 10, price: 20 },
  { sku: "large", weightGrams: 250, inStock: true, stockQuantity: 5, price: 40 },
] };
assert.equal(preferredStockedOptionIndex(product), 1, "Default suggestion size is maintained 50g");
const weighted = ensureWholesaleMinimum([{ product, optionIndex: 1, quantity: 5 }], { role: "New Customer", minimumOrderWeightGrams: 500 });
assert.equal(weighted.meetsMinimum, true);
assert.equal(weighted.selections[0].quantity, 10);
assert.equal(weighted.totalWeight, 500);
const insufficient = ensureWholesaleMinimum([{ product, optionIndex: 1, quantity: 5 }], { role: "New Customer", minimumOrderWeightGrams: 1000 });
assert.equal(insufficient.meetsMinimum, false, "Minimum adjustment must never exceed live stock");
assert.equal(insufficient.selections[0].quantity, 10);
const mixed = SUGGESTED_BLEND_RECIPES.find((recipe) => recipe.id === "mixed-indigenous-nations");
assert.ok(recipeScore(product, mixed) > 0, "Promoted tribal categories still match the indigenous collection");
console.log("Order suggestion checks passed: eligible history, current sizes, unavailable stock and minimum-order limits.");
