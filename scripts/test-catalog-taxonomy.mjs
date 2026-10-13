import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/catalog-taxonomy.js", import.meta.url), "utf8");
const { getCatalogTaxonomy, groupCatalogProducts, catalogProductTitle, MAIN_CATEGORIES } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);

const tribes = ["Apurinã", "Caboclos", "Katukina", "Huni Kuin", "Kuntanawa", "Nukini", "Puyanawa", "Shanenawa", "Shawadawa", "Shawandawa", "Yawanawá"];
for (const tribe of tribes) {
  for (const product of [{ category: tribe, tribe }, { category: "Rapé Indigenous", tribe }]) {
    assert.deepEqual(getCatalogTaxonomy(product), { mainCategory: "Indigenous Hapé", subcategory: tribe });
  }
}
assert.deepEqual(getCatalogTaxonomy({ category: "Sacred Connection", tribe: "Tobacco-Free" }), { mainCategory: "Sacred Connection Hapé", subcategory: "Tobacco-Free" });
for (const [category, tribe, expected] of [["Accessories", "Kuripe", "Kuripe"], ["Accessories", "Tepi", "Tepi"], ["Accessories", "Bottles", "Containers"]]) {
  assert.deepEqual(getCatalogTaxonomy({ category, tribe }), { mainCategory: "Accessories", subcategory: expected });
}
assert.equal(getCatalogTaxonomy({ category: "Ashes", tribe: "Yawanawá" }).mainCategory, "Other Products", "Tribal ashes must not be grouped with Hapé");
assert.equal(getCatalogTaxonomy({ category: "Accessories", tribe: "Huni Kuin" }).mainCategory, "Accessories", "Tribal accessories must not be grouped with Hapé");
assert.equal(getCatalogTaxonomy({ category: "Mapacho", tribe: "Rolls" }).mainCategory, "Mapacho");
assert.equal(getCatalogTaxonomy({ category: "Incense" }).mainCategory, "Other Products");
assert.equal(getCatalogTaxonomy({ category: "Unrecognized future category" }).mainCategory, "Other Products", "Unknown groups remain discoverable");

const products = [
  { id: 1, name: "Z", category: "Ashes", tribe: "" },
  { id: 2, name: "A", category: "Yawanawá", tribe: "Yawanawá" },
  { id: 3, name: "B", category: "Huni Kuin", tribe: "Huni Kuin" },
  { id: 4, name: "A", category: "Huni Kuin", tribe: "Huni Kuin" },
  { id: 5, name: "Blend", category: "Sacred Connection", tribe: "Tobacco-Free" },
  { id: 6, name: "Kuripe", category: "Accessories", tribe: "Kuripe" },
  { id: 7, name: "Roll", category: "Mapacho", tribe: "Rolls" },
];
const original = JSON.stringify(products);
const groups = groupCatalogProducts(products);
assert.deepEqual(groups.map((group) => group.name), MAIN_CATEGORIES);
assert.deepEqual(groups[0].subcategories.map((group) => group.name), ["Huni Kuin", "Yawanawá"]);
assert.deepEqual(groups[0].subcategories[0].products.map((product) => product.name), ["A", "B"]);
assert.equal(JSON.stringify(products), original, "Grouping must preserve original categories used by role pricing");
assert.equal(catalogProductTitle({ name: "Wholesale - Sacred Connection - Hapé - Huni Kuin Cacau" }), "Huni Kuin Cacau");
assert.equal(catalogProductTitle({ category: "Huni Kuin", tribe: "Huni Kuin", name: "Huni Kuin - Cacau Rapeh" }), "Cacau");
assert.equal(catalogProductTitle({ category: "Yawanawá", tribe: "Yawanawá", name: "Yawanawa - Mulateiro Rapeh" }), "Mulateiro");
assert.equal(catalogProductTitle({ category: "Sacred Connection", tribe: "Tobacco-Free", name: "Sacred Connection - Aura Cleanse Tobacco-Free Rapeh" }), "Aura Cleanse Tobacco-Free");
assert.equal(catalogProductTitle({ category: "Accessories", name: "Container for Rapeh" }), "Container for Rapeh", "Non-Hapé product names must remain intact");
assert.equal(catalogProductTitle({ category: "Huni Kuin", tribe: "Huni Kuin", name: "Yawanawa - Cacau Rapeh" }), "Yawanawa - Cacau", "Never remove a different origin");
console.log("Catalog taxonomy checks passed: all review tribes, non-Hapé groups, ordering and pricing-category preservation.");
