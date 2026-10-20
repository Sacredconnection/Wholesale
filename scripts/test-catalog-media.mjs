import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/lib/catalog-media.js", import.meta.url), "utf8");
const { FALLBACK_PRODUCT_IMAGES, getCatalogImage } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
for (const [id, image] of Object.entries(FALLBACK_PRODUCT_IMAGES)) {
  assert.equal(decodeURIComponent(getCatalogImage({ wcId: Number(id) })), image);
  await access(new URL(`../public${image}`, import.meta.url));
  assert.equal(getCatalogImage({ wcId: Number(id), image: "https://store.example/current.jpg" }), "https://store.example/current.jpg");
  assert.equal(getCatalogImage({ id: Number(id), images: [{ src: "https://store.example/current.jpg" }] }), "https://store.example/current.jpg");
  assert.equal(getCatalogImage({ wcId: Number(id), storeId: "another-store" }), null, "IDs from another store cannot reuse this photo");
}
assert.equal(getCatalogImage({ wcId: 5710, name: "Sacred Connection - Bobinsana Rapeh" }), null, "Do not assign the ambiguous MS Bobinsana image");
assert.equal(getCatalogImage({ wcId: 999999 }), null);
console.log(`Catalog media checks passed: ${Object.keys(FALLBACK_PRODUCT_IMAGES).length} verified local assets, remote precedence and unknown-product placeholders.`);
