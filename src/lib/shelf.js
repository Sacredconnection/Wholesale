export const SHELF_META_PREFIX = "sc_shelf_product_";
export const SHELF_LIMIT = 250;

export function shelfProductId(product) {
  const id = Number(product?.wcId);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function readShelfIds(meta = []) {
  const latest = new Map();
  for (const entry of meta) {
    if (!entry.key?.startsWith(SHELF_META_PREFIX)) continue;
    const suffix = entry.key.slice(SHELF_META_PREFIX.length);
    if (!/^[1-9]\d*$/.test(suffix)) continue;
    const id = Number(suffix);
    if (!Number.isSafeInteger(id)) continue;
    latest.set(id, entry.value === true || entry.value === "true" || entry.value === 1 || entry.value === "1");
  }
  return [...latest].filter(([, saved]) => saved).map(([id]) => id);
}
