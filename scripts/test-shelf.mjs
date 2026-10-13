// Run: node --experimental-vm-modules scripts/test-shelf.mjs
// Real route, security checks, mapping and WooCommerce client; all HTTP is mocked.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://wholesale.example.test";
let customer;
let session;
let configured;
let products;
let calls;
let writes;
let rateLimit;
const clone = (value) => JSON.parse(JSON.stringify(value));

function reset() {
  customer = {
    id: 7, email: "partner@example.test", role: "New Customer",
    meta_data: [
      { id: 1, key: "billing_company", value: "Original business" },
      { id: 2, key: "account_discount", value: 15 },
      { id: 3, key: "sc_shelf_product_11", value: true },
    ],
  };
  session = { customerId: 7, email: customer.email };
  configured = true;
  products = new Map([[12, { id: 12, status: "publish" }], [13, { id: 13, status: "private" }]]);
  calls = [];
  writes = [];
  rateLimit = null;
}
reset();

function fields(value, url) {
  const requested = url.searchParams.get("_fields");
  if (!requested) return value;
  return Object.fromEntries(requested.split(",").filter((key) => key in value).map((key) => [key, value[key]]));
}

async function mockedFetch(input, options) {
  const url = new URL(input);
  assert.equal(url.origin, "https://woocommerce.invalid", "No external service is reachable from these tests");
  const method = options.method || "GET";
  calls.push({ path: url.pathname, method });
  if (method === "GET" && url.pathname === "/wp-json/wc/v3/customers") {
    return Response.json([fields(customer, url)]);
  }
  if (method === "GET" && /^\/wp-json\/wc\/v3\/products\/\d+$/.test(url.pathname)) {
    const product = products.get(Number(url.pathname.split("/").at(-1)));
    return product ? Response.json(fields(product, url)) : Response.json({ message: "Unknown product" }, { status: 404 });
  }
  if (method === "PUT" && url.pathname === `/wp-json/wc/v3/customers/${customer.id}`) {
    const body = JSON.parse(options.body);
    assert.deepEqual(Object.keys(body), ["meta_data"], "Shelf changes must not submit unrelated customer fields");
    assert.equal(body.meta_data.length, 1, "Each mutation changes only its own product key");
    writes.push(clone(body.meta_data[0]));
    for (const patch of body.meta_data) {
      assert.match(patch.key, /^sc_shelf_product_[1-9]\d*$/);
      const existing = customer.meta_data.find((entry) => entry.id === patch.id);
      if (existing) Object.assign(existing, patch);
      else customer.meta_data.push({ id: Math.max(0, ...customer.meta_data.map((entry) => entry.id)) + 1, ...patch });
    }
    return Response.json(customer);
  }
  throw new Error(`Unexpected mocked request: ${method} ${url.pathname}`);
}

const context = vm.createContext({
  console, process: { env: {} }, Response, Request, URL, Buffer, AbortSignal,
  fetch: mockedFetch,
});
const mocks = {
  "server-only": {},
  "@/lib/session": { getSession: async () => session },
  "@/lib/commerce-stores": {
    PRIMARY_STORE_ID: "sacred-connection",
    isCommerceStoreConfigured: () => configured,
    getCommerceStore: () => ({ baseUrl: "https://woocommerce.invalid", consumerKey: "test-only", consumerSecret: "test-only" }),
  },
  "@/lib/abuse-protection": {
    enforceRateLimit: async () => rateLimit,
    rateLimitIdentity: () => "shelf-test",
  },
};
const cache = new Map();
async function load(specifier) {
  if (cache.has(specifier)) return cache.get(specifier);
  let loadedModule;
  if (specifier in mocks) {
    const values = mocks[specifier];
    loadedModule = new vm.SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value);
    }, { context });
  } else {
    assert.ok(specifier.startsWith("@/"), `Only known local modules may load: ${specifier}`);
    const filename = path.join(root, `${specifier.replace(/^@\//, "src/")}.js`);
    loadedModule = new vm.SourceTextModule(await readFile(filename, "utf8"), { context, identifier: filename });
  }
  cache.set(specifier, loadedModule);
  await loadedModule.link(load);
  return loadedModule;
}

const shelfModule = await load("@/lib/shelf");
await shelfModule.evaluate();
const { readShelfIds, shelfProductId, SHELF_LIMIT } = shelfModule.namespace;
const routeModule = await load("@/app/api/account/shelf/route");
await routeModule.evaluate();
const { GET, PATCH } = routeModule.namespace;

assert.equal(shelfProductId({ wcId: "12" }), 12);
for (const wcId of [null, undefined, "bad", 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
  assert.equal(shelfProductId({ wcId }), null);
}
assert.deepEqual(Array.from(readShelfIds([
  { key: "sc_shelf_product_1", value: true },
  { key: "sc_shelf_product_1", value: false },
  { key: "sc_shelf_product_2", value: "true" },
  { key: "sc_shelf_product_3", value: 1 },
  { key: "sc_shelf_product_4", value: "1" },
  { key: "sc_shelf_product_5", value: "false" },
  { key: "sc_shelf_product_01", value: true },
  { key: "sc_shelf_product_0", value: true },
  { key: "sc_shelf_product_9007199254740992", value: true },
  { key: "unrelated", value: true },
])), [2, 3, 4], "Latest metadata value wins; malformed references do not become favorites");

function request(body, { requestOrigin = origin, contentType = "application/json", raw = false } = {}) {
  return new Request(`${origin}/api/account/shelf`, {
    method: "PATCH",
    headers: { ...(requestOrigin ? { Origin: requestOrigin } : {}), "Content-Type": contentType },
    body: raw ? body : JSON.stringify(body),
  });
}
async function assertRejected(body, status, options) {
  const before = writes.length;
  const response = await PATCH(request(body, options));
  assert.equal(response.status, status, await response.clone().text());
  assert.equal(writes.length, before, "A rejected request must not mutate customer data");
}

// Authentication is resolved from the signed session, never a body customer ID.
session = null;
assert.equal((await GET()).status, 401);
await assertRejected({ productId: 12, saved: true }, 401);
reset();
session.customerId = 999;
assert.equal((await GET()).status, 401);
await assertRejected({ productId: 12, saved: true, customerId: 7 }, 401);
reset();
session.email = "someone-else@example.test";
assert.equal((await GET()).status, 401);
reset();
customer.role = "customer";
assert.equal((await GET()).status, 401);
await assertRejected({ productId: 12, saved: true }, 401);
reset();

await assertRejected({ productId: 12, saved: true }, 403, { requestOrigin: "https://other.example.test" });
await assertRejected({ productId: 12, saved: true }, 403, { requestOrigin: "" });
assert.equal(calls.length, 0, "Cross-origin rejection happens before customer lookup");
for (const productId of [0, -1, "12", 1.5, null, Number.MAX_SAFE_INTEGER + 1]) {
  await assertRejected({ productId, saved: true }, 400);
}
await assertRejected({ productId: 12, saved: "true" }, 400);
await assertRejected("{", 400, { raw: true });
await assertRejected({ productId: 12, saved: true, extra: "x".repeat(2100) }, 413);
await assertRejected("plain text", 415, { raw: true, contentType: "text/plain" });

// Exercise the real updateCustomerMeta helper through its mocked WC HTTP boundary.
reset();
const unrelated = clone(customer.meta_data.slice(0, 2));
let response = await PATCH(request({ productId: 12, saved: true }));
assert.equal(response.status, 200);
assert.deepEqual((await response.json()).productIds, [11, 12]);
assert.deepEqual(customer.meta_data.slice(0, 2), unrelated);
assert.deepEqual(writes[0], { key: "sc_shelf_product_12", value: true });
response = await GET();
assert.equal(response.headers.get("cache-control"), "no-store");
assert.deepEqual((await response.json()).productIds, [11, 12]);
response = await PATCH(request({ productId: 11, saved: false }));
assert.equal(response.status, 200);
assert.deepEqual((await response.json()).productIds, [12]);
assert.deepEqual(writes.at(-1), { id: 3, key: "sc_shelf_product_11", value: false });
assert.deepEqual(customer.meta_data.slice(0, 2), unrelated);
assert.equal(customer.meta_data.find((entry) => entry.key === "sc_shelf_product_12").value, true);
// A saved reference can be removed even after its product leaves WooCommerce.
products.delete(12);
assert.equal((await PATCH(request({ productId: 12, saved: false }))).status, 200);
assert.deepEqual(Array.from(readShelfIds(customer.meta_data)), []);

reset();
await assertRejected({ productId: 13, saved: true }, 404);
customer.role = "administrator";
assert.equal((await PATCH(request({ productId: 13, saved: true }))).status, 200);

reset();
customer.meta_data = Array.from({ length: SHELF_LIMIT }, (_, index) => ({
  id: index + 1, key: `sc_shelf_product_${index + 1}`, value: true,
}));
products.set(251, { id: 251, status: "publish" });
await assertRejected({ productId: 251, saved: true }, 422);
assert.equal((await PATCH(request({ productId: 12, saved: true }))).status, 200, "Saving an existing favorite remains idempotent at capacity");
assert.equal(readShelfIds(customer.meta_data).length, SHELF_LIMIT);
assert.equal((await PATCH(request({ productId: 12, saved: false }))).status, 200);
assert.equal((await PATCH(request({ productId: 251, saved: true }))).status, 200);
assert.equal(readShelfIds(customer.meta_data).length, SHELF_LIMIT);

reset();
configured = false;
assert.equal((await GET()).status, 503);
await assertRejected({ productId: 12, saved: true }, 503);
assert.equal(calls.length, 0);
reset();
rateLimit = Response.json({ error: "Too many requests" }, { status: 429 });
await assertRejected({ productId: 12, saved: true }, 429);
assert.equal(calls.length, 0);

console.log("Shelf tests passed: metadata parsing, account authentication, CSRF, input limits, isolated save/remove, private products, persistence and 250-item limit. All HTTP mocked.");
