import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { jsPDF } from "jspdf";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.js`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { renderCatalogListPdf } = await import("../src/lib/catalog-pdf.js");
const { buildCatalogOrderWorkbook } = await import("../src/lib/catalog-export.js");
const { generateCatalogPdf, loadPdfCatalog } = await import("../src/lib/catalog-pdf-export.js");
const { readCatalogOrderWorkbook, ORDER_WORKBOOK_META_SHEET } = await import("../src/lib/catalog-order-workbook.js");
const user = { role: "New Customer" };
const option = (sku, overrides = {}) => ({
  sku, name: "20 g", weightGrams: 20, inStock: true, stockQuantity: 20,
  price: 30, rolePrices: { "New Customer": 7.5 }, availabilityLabel: "20 units in stock",
  ...overrides,
});
const products = [
  { id: "sacred-connection~1", name: "Yawanawá Mulateiro", sku: "MUL", category: "Yawanawá", tribe: "Yawanawá", pricingVisible: true, options: [
    option("MUL-20"),
    option("MUL-100", { name: "100 g", weightGrams: 100, stockLimited: true, stockQuantity: 3, lifecycle: "phase-out" }),
    option("HIDDEN-500", { name: "500 g", weightGrams: 500, stockLimited: true, stockQuantity: 0, inStock: false }),
    option("BACKORDER-250", { name: "250 g", weightGrams: 250, inStock: false, stockQuantity: 0, availabilityLabel: "Available on backorder" }),
  ] },
  { id: "sacred-connection~2", name: "Kuripe", sku: "KUR", category: "Accessories", tribe: "Kuripe", pricingVisible: true, options: [option("KUR-1", { name: "Single", weightGrams: 0 })] },
];

const workbook = await buildCatalogOrderWorkbook({ products, user });
assert.deepEqual(workbook.worksheets.filter((sheet) => sheet.name !== ORDER_WORKBOOK_META_SHEET).map((sheet) => sheet.name), ["Indigenous Hapé", "Accessories"]);
let expectedRows = 0;
for (const sheet of workbook.worksheets) {
  if (sheet.name === ORDER_WORKBOOK_META_SHEET) continue;
  for (let number = 7; number <= sheet.rowCount; number += 1) {
    const row = sheet.getRow(number);
    const token = row.getCell(8);
    if (token.isMerged || !token.value) continue;
    const { sku } = JSON.parse(token.value);
    assert.notEqual(sku, "HIDDEN-500");
    assert.equal(row.getCell(6).value, 7.5, "Export keeps WooCommerce role prices");
    assert.equal(row.getCell(7).protection.locked, false);
    if (sku === "MUL-100") assert.match(row.getCell(7).dataValidation.formulae[0], /<=3,/);
    row.getCell(7).value = sku === "MUL-20" ? 5 : 1;
    expectedRows += 1;
  }
}
assert.equal(expectedRows, 4);
const bytes = await workbook.xlsx.writeBuffer();
const imported = await readCatalogOrderWorkbook(new File([bytes], "catalog.xlsx"));
assert.deepEqual(imported.map((item) => item.sku).sort(), ["BACKORDER-250", "KUR-1", "MUL-100", "MUL-20"].sort());
assert.equal(imported.find((item) => item.sku === "MUL-20").quantity, 5);
await assert.rejects(() => buildCatalogOrderWorkbook({ products: [], user }), /No available/);

const drawnText = [];
function RecordingPdf(options) {
  const pdf = new jsPDF(options);
  const original = pdf.text.bind(pdf);
  pdf.text = (value, x, y, ...rest) => {
    drawnText.push({ value, x, y, page: pdf.getCurrentPageInfo().pageNumber });
    return original(value, x, y, ...rest);
  };
  return pdf;
}
const manyOptions = Array.from({ length: 85 }, (_, index) => ({
  name: `${index + 1} g`, sku: `PAGINATION-SKU-${index}`, availabilityLabel: index % 2 ? "Available on backorder" : "In stock", catalogPrice: index + 0.99,
}));
const pdf = renderCatalogListPdf({
  jsPDF: RecordingPdf,
  groups: [{ name: "Indigenous Hapé", subcategories: [{ name: "Yawanawá", products: [{ id: "long", name: "Mulateiro full available assortment", description: "A brief product description for the PDF catalog.", sku: "MUL", options: manyOptions }] }] }],
  generatedAtLabel: "Oct 13, 2026, 12:00 (America/Sao_Paulo)",
});
const flattened = drawnText.flatMap(({ value }) => Array.isArray(value) ? value : [value]);
assert.ok(pdf.getNumberOfPages() >= 2, "Long format lists continue across pages");
for (let index = 0; index < 85; index += 1) {
  assert.equal(flattened.filter((text) => text.includes(`PAGINATION-SKU-${index}`)).length, 0);
  assert.ok(flattened.includes(`${index + 1} g: $${(index + 0.99).toFixed(2)}`));
}
assert.ok(flattened.includes("A brief product description for the PDF catalog."));
assert.ok(flattened.every((text) => !/SKU|Availability|In stock|backorder|Product option/i.test(text)), "PDF excludes inventory and technical details");
assert.ok(drawnText.every(({ y }) => y >= 0 && y <= 289), "Text stays within page margins");

const originalFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async (url, options) => {
  calls += 1;
  assert.equal(options.credentials, "same-origin");
  assert.match(url, /export=true/);
  return Response.json({ products });
};
try {
  const loaded = await loadPdfCatalog();
  assert.equal(calls, 1);
  assert.equal(loaded[0].options.length, 3);
  const progress = [];
  const result = await generateCatalogPdf({ products: loaded, user, onProgress: (event) => progress.push(event) });
  assert.equal(calls, 1, "Generation reuses selected catalog without another request");
  assert.equal(result.productCount, 2);
  assert.equal(result.blob.type, "application/pdf");
  assert.ok(result.blob.size > 1000);
  assert.equal(progress.at(-1).completed, progress.at(-1).total);
  await assert.rejects(() => generateCatalogPdf({ products: [], user }), /Select at least/);
  const output = process.argv.find((argument) => argument.startsWith("--output="))?.slice(9);
  if (output) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, new Uint8Array(await result.blob.arrayBuffer()));
    await writeFile(output.replace(/\.pdf$/i, "-pagination.pdf"), new Uint8Array(pdf.output("arraybuffer")));
  }
} finally {
  globalThis.fetch = originalFetch;
}
console.log("Catalog export checks passed: role pricing, availability, category sheets, Excel round-trip, PDF pagination and single catalog request.");
