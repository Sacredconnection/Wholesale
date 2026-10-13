// Run: node --experimental-vm-modules scripts/test-catalog-availability.mjs
// All commerce calls are mocked; these tests cannot create an external order.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import * as crypto from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const context = vm.createContext({ console, process: { env: {} }, Response, Request, URL, setTimeout, clearTimeout });
const cache = new Map();
let parent;
let variations;
let creates = 0;
const store = { id: "sacred-connection", name: "Sacred Connection" };
const customer = { id: 1, role: "New Customer", email: "test@example.com", meta_data: [] };
const mocks = {
  "server-only": {},
  "node:crypto": crypto,
  "@/lib/woocommerce": {
    createOrder: async () => { creates += 1; throw new Error("External creation is forbidden in tests"); },
    findProductBySku: async (sku) => variations.find((variation) => variation.sku === sku),
    getCustomerByEmail: async () => customer,
    getOrdersByEmail: async () => [],
    getProductById: async () => parent,
    getVariationById: async (_productId, id) => variations.find((variation) => variation.id === id),
    WooCommerceApiError: class extends Error {},
  },
  "@/lib/commerce-stores": {
    getMissingCommerceStores: () => [], getRequiredCommerceStores: () => [store], PRIMARY_STORE_ID: store.id,
  },
  "@/lib/request-security": {
    cleanText: (value, length) => String(value || "").slice(0, length), isSameOrigin: () => true,
    readJsonBody: (request) => request.json(), RequestBodyError: class extends Error {},
    securityError: (error, status) => Response.json({ error }, { status }),
  },
  "@/lib/session": { getSession: async () => ({ email: customer.email, customerId: customer.id }) },
  "@/lib/countries": { isSupportedCountryCode: () => true },
  "@/lib/abuse-protection": {
    completeIdempotency: async () => {}, enforceRateLimit: async () => null,
    rateLimitIdentity: () => "test", readIdempotencyKey: () => "test-request",
    releaseIdempotency: async () => {}, reserveIdempotency: async () => ({ handle: "test" }),
  },
  "@/lib/local-dev-upstream": { isLocalDevUpstreamEnabled: () => false, proxyLocalDevUpstream: () => {} },
};

async function load(specifier) {
  if (cache.has(specifier)) return cache.get(specifier);
  let loadedModule;
  if (specifier in mocks) {
    const values = mocks[specifier];
    loadedModule = new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  } else {
    const filename = path.join(root, specifier.replace(/^@\//, "src/") + ".js");
    loadedModule = new vm.SourceTextModule(await readFile(filename, "utf8"), { context, identifier: filename });
  }
  cache.set(specifier, loadedModule);
  await loadedModule.link(load);
  return loadedModule;
}

const pricingModule = await load("@/lib/pricing");
await pricingModule.evaluate();
const pricing = pricingModule.namespace;
const mapperModule = await load("@/lib/wc-mappers");
await mapperModule.evaluate();
const mapper = mapperModule.namespace;
const lifecycleModule = await load("@/lib/catalog-lifecycle");
await lifecycleModule.evaluate();
const lifecycle = lifecycleModule.namespace;
const routeModule = await load("@/app/api/orders/route");
await routeModule.evaluate();

const product = (tribe = "Huni Kuin", name = "Cumaru") => ({
  id: 10, slug: "test-hape", type: "variable", name: `${tribe} ${name} Rapeh`,
  categories: [{ id: 1, name: "Indigenous Rapé" }, { id: 2, name: tribe }],
  attributes: [{ name: "Tribe", options: [tribe] }], stock_status: "instock", stock_quantity: null,
});
const variation = (weight, stock, id = weight) => ({
  id, parent_id: 10, sku: `HAPE-${id}`, price: "1", attributes: [{ name: "Size", option: `${weight}g` }],
  stock_status: stock === 0 ? "outofstock" : "instock", stock_quantity: stock, manage_stock: true,
});
const map = (source, options) => mapper.mapProduct(source, options,
  mapper.buildCategoryContext([{ id: 1, name: "Indigenous Rapé", parent: 0 }, { id: 2, name: source.attributes[0].options[0], parent: 1 }]));

let mapped = map(product(), [variation(5, 9), variation(10, 0), variation(100, 1), variation(500, 0)]);
assert.deepEqual(Array.from(mapped.options, (option) => option.weightGrams), [10, 100]);
assert.equal(pricing.maximumOrderQuantity(mapped.options[1]), 1);
assert.ok(pricing.orderQuantityError(mapped.options[1], 2));
assert.equal(pricing.needsBackorder(mapped.options[1], 2), false);
assert.equal(pricing.needsBackorder(mapped.options[0], 10), true);
mapped = map(product(), [variation(100, null)]);
assert.equal(mapped.options.length, 1, "unknown stock stays visible for confirmation");
assert.equal(mapped.options[0].stockQuantity, null);
assert.ok(pricing.orderQuantityError(mapped.options[0], 1));
assert.equal(pricing.orderableStockQuantity({ stockQuantity: -2, weightGrams: 100 }), 0);
assert.equal(map(product("Katukina", "Tsunu"), [variation(20, 15)]).catalogVisible, false);
assert.equal(map(product("Huni Kuin", "Tsunu"), [variation(20, 0)]).catalogVisible, false);
assert.equal(map(product("Nukini", "Tsunu"), [variation(20, 0)]).options.length, 1, "another tribe is unaffected");
assert.equal(map(product("Kuntanawa", "Jatobá Extra"), [variation(20, 10)]).lifecycle, "active", "similar names do not match");
const accessory = { ...product(), name: "Huni Kuin Kuripe", categories: [{ name: "Accessories" }] };
assert.equal(lifecycle.productLifecycle(accessory).isHape, false);
assert.equal(map(accessory, [variation(100, 0)]).options.length, 1);
assert.equal(lifecycle.productLifecycle({ name: "Huni Kuin Rapé Kuripe", categories: [{ name: "Kuripes" }] }).isHape, false);
mapped = map(product("Huni Kuin", "Cumaru de Cheiro"), [variation(20, 0), variation(50, 5)]);
assert.notEqual(mapped.options[0].availabilityLabel, "Made to order", "MTO applies after whole variety sells through");
assert.equal(map(product("Nukini", "Cravinho"), [variation(20, 0)]).options[0].availabilityLabel, "Made to order");

// Exact published listing names from the read-only WooCommerce catalog audit.
// The two spelling disagreements remain active until their mapping is approved.
const auditedListings = [
  [5718, "Caboclo - Amazon Green Rapeh", "Caboclo", "phase-out"],
  [3401, "Katukina - Caneleiro Rapeh", "Katukina", "removed"],
  [3430, "Katukina - Tsunu Rapeh", "Katukina", "removed"],
  [3252, "Huni Kuin - Emburana Rapeh", "Huni Kuin", "phase-out"],
  [3279, "Huni Kuin - Iban Rapeh", "Huni Kuin", "phase-out"],
  [3280, "Huni Kuin - Mulateiro Rapeh", "Huni Kuin", "phase-out"],
  [3284, "Huni Kuin - Tradition Rapeh", "Huni Kuin", "phase-out"],
  [3309, "Huni Kuin - Uxi Rapeh", "Huni Kuin", "phase-out"],
  [3318, "Huni Kuin - Tsunu Rapeh", "Huni Kuin", "phase-out"],
  [3251, "Huni Kuin - Cumaru de Cheiro Rapeh", "Huni Kuin", "made-to-order"],
  [3461, "Kuntanawa - Canela de Velho Rapeh", "Kuntanawa", "phase-out"],
  [3463, "Kuntanawa - Copaíba Rapeh", "Kuntanawa", "phase-out"],
  [3489, "Kuntanawa - Jatobá Rapeh", "Kuntanawa", "phase-out"],
  [3519, "Kuntanawa - Samauma Flower Rapeh", "Kuntanawa", "phase-out"],
  [3579, "Nukini - Cravinho Rapeh", "Nukini", "made-to-order"],
  [5749, "Yawanawa - Pai Nani Rapeh", "Yawanawa", "phase-out"],
  [5561, "Yawanawa - Waxy Rapeh", "Yawanawa", "phase-out"],
  [3731, "Yawanawa - Chief Rapeh", "Yawanawa", "removed"],
  [3459, "Kuntanawa - Aya Rapeh", "Kuntanawa", "active"],
  [3490, "Kuntanawa - Kapaxanba Rapeh", "Kuntanawa", "active"],
  [3340, "Caboclo - Cumaru Trevo Rapeh", "Caboclo", "phase-out"],
  [3372, "Caboclo - Samaúma Croa Rapeh", "Caboclo", "phase-out"],
  [5757, "Yawanawa - Runu Rapeh", "Yawanawa", "phase-out"],
  [3249, "Huni Kuin - Capemba Rapeh", "Huni Kuin", "made-to-order"],
];
for (const [id, name, tribe, expected] of auditedListings) {
  assert.equal(lifecycle.productLifecycle({ id, name, categories: [{ name: tribe }] }).lifecycle, expected, `${id}: ${name}`);
}
assert.equal(lifecycle.productLifecycle({ id: 3340, name: "Nukini - Cumaru Trevo Rapeh", categories: [{ name: "Nukini" }] }).lifecycle, "active", "verified listing still requires exact origin");
assert.equal(lifecycle.productLifecycle({ id: 9999, name: "Caboclo - Cumaru Trevo Rapeh", categories: [{ name: "Caboclo" }] }).lifecycle, "active", "unverified duplicate listing is not altered");
const waxy = {
  id: 5561, name: "Yawanawa - Waxy Rapeh", slug: "yawanawa-waxy-rapeh", type: "variable",
  stock_status: "outofstock", stock_quantity: null, categories: [{ id: 34, name: "Yawanawa" }],
};
const waxyOptions = [[5565, "RAYA0309", 5], [5564, "RAYA0304", 10], [5563, "RAYA0305", 20], [5562, "RAYA0306", 50]]
  .map(([id, sku, grams]) => ({ id, sku, stock_status: "outofstock", stock_quantity: 0, manage_stock: true, backorders: "no", attributes: [{ name: "Weight", option: `${grams}gr` }] }));
assert.equal(mapper.mapProduct(waxy, waxyOptions).catalogVisible, false);
assert.equal(mapper.mapProduct(waxy, []).catalogVisible, false, "Waxy also disappears from the lazy catalog summary");

async function submit(source, options, quantities) {
  parent = source;
  variations = options;
  const items = quantities.map(([id, quantity]) => ({ wcProductId: 10, wcVariationId: id, quantity }));
  const response = await routeModule.namespace.POST(new Request("https://example.com/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, acceptedBackorderItems: options.map((option) => `${store.id}:10:${option.id}`) }),
  }));
  return { status: response.status, body: await response.json() };
}

let result = await submit(product(), [variation(100, 0)], [[100, 1]]);
assert.equal(result.body.code, "item_no_longer_orderable", "accepted backorder cannot override retired size");
result = await submit(product(), [variation(100, 2)], [[100, 2], [100, 1]]);
assert.equal(result.body.code, "item_no_longer_orderable", "duplicate lines share remaining stock");
result = await submit(product(), [variation(100, null)], [[100, 1]]);
assert.equal(result.body.code, "item_no_longer_orderable", "unknown balance cannot be bought");
const inheritedParent = { ...product(), manage_stock: true, stock_quantity: 15 };
const inherited = [variation(5, null), variation(100, null)].map((option) => ({ ...option, manage_stock: false }));
result = await submit(inheritedParent, inherited, [[5, 10], [100, 6]]);
assert.equal(result.body.code, "item_no_longer_orderable", "distinct formats share parent stock");
result = await submit(inheritedParent, inherited, [[5, 10], [100, 5]]);
assert.match(result.body.error, /Minimum wholesale/, "different pack sizes can consume exactly the shared balance");
result = await submit(product(), [variation(20, 0)], [[20, 5]]);
assert.match(result.body.error, /Minimum wholesale/, "maintained sizes can still be ordered with restock acceptance");
result = await submit(product("Yawanawá", "Chief"), [variation(250, 5)], [[250, 1]]);
assert.equal(result.body.code, "item_no_longer_orderable", "removed variety cannot use old cart/API");
assert.equal(creates, 0);
console.log("Availability tests passed: lifecycle, visibility, unknown/negative stock, packs, parent stock, duplicate/API bypass, and retained backorders.");
