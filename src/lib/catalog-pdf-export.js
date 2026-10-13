"use client";

import { getOrderableProductOptions, optionPriceForUser } from "@/lib/pricing";
import { catalogProductTitle, getCatalogTaxonomy, groupCatalogProducts } from "@/lib/catalog-taxonomy";
import { renderCatalogListPdf } from "@/lib/catalog-pdf";

const normal = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function exportableProducts(products) {
  return products.flatMap((product) => {
    const options = getOrderableProductOptions(product);
    return options.length ? [{ ...product, options }] : [];
  });
}

export async function loadPdfCatalog({ signal } = {}) {
  const response = await fetch("/api/catalog?export=true&orderWorkbook=true", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The catalog could not be loaded. Please try again.");
  const products = exportableProducts(Array.isArray(data.products) ? data.products : []);
  if (!products.length) throw new Error("No products are available for PDF export.");
  return products;
}

async function loadProductImage(product) {
  if (!product.image) return null;
  let source = product.image;
  if (!source.startsWith("/products/")) {
    const response = await fetch(`/api/catalog/image?url=${encodeURIComponent(source)}&v=base64-json-v3`, { cache: "force-cache", signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;
    const payload = await response.json();
    const mimeType = payload.mimeType || { JPEG: "image/jpeg", PNG: "image/png", WEBP: "image/webp" }[payload.format];
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType) || !payload.base64) return null;
    source = `data:${mimeType};base64,${payload.base64}`;
  }
  const image = new Image();
  image.decoding = "async";
  const loaded = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Product image timed out.")), 15000);
    image.onload = () => { clearTimeout(timeout); resolve(); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error("Product image could not be loaded.")); };
  });
  image.src = source;
  await loaded;
  if (!image.naturalWidth || !image.naturalHeight) return null;
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 160, 160);
  const scale = Math.min(160 / image.naturalWidth, 160 / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  context.drawImage(image, (160 - width) / 2, (160 - height) / 2, width, height);
  return { dataUrl: canvas.toDataURL("image/png"), format: "PNG" };
}

export async function generateCatalogPdf({ products, user, filterLabel = "Selected catalog", onProgress } = {}) {
  if (!Array.isArray(products) || !products.length) throw new Error("Select at least one product before generating your PDF.");
  const selected = exportableProducts(products).map((product) => ({
    ...product,
    title: catalogProductTitle(product),
    options: product.options.map((option) => ({
      ...option,
      catalogPrice: optionPriceForUser(option, user),
    })),
  }));
  if (!selected.length) throw new Error("The selected products no longer have available formats.");
  if (user && selected.some((product) => product.pricingVisible === false)) {
    throw new Error("Your prices could not be loaded. Reopen the export and sign in with your wholesale account.");
  }
  const generatedAt = new Date();
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const generatedAtLabel = `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium", timeStyle: "short", ...(timeZone ? { timeZone } : {}),
  }).format(generatedAt)}${timeZone ? ` (${timeZone})` : ""}`;
  const total = selected.length * 2;
  const images = new Map();
  const cachedImages = new Map();
  let loaded = 0;
  onProgress?.({ completed: 0, total, label: "Preparing your selected products..." });
  for (let start = 0; start < selected.length; start += 6) {
    await Promise.all(selected.slice(start, start + 6).map(async (product) => {
      if (!cachedImages.has(product.image)) {
        cachedImages.set(product.image, loadProductImage(product).catch(() => null));
      }
      images.set(product.id, await cachedImages.get(product.image));
      loaded += 1;
      onProgress?.({ completed: loaded, total, label: `Preparing images: ${loaded} of ${selected.length}` });
    }));
  }
  const { jsPDF } = await import("jspdf");
  const pdf = renderCatalogListPdf({
    jsPDF,
    groups: groupCatalogProducts(selected),
    images,
    generatedAt,
    generatedAtLabel,
    filterLabel,
    includePrices: Boolean(user),
    onProductRendered: (count) => onProgress?.({
      completed: selected.length + count,
      total,
      label: `Formatting products: ${count} of ${selected.length}`,
    }),
  });
  const localDate = [generatedAt.getFullYear(), String(generatedAt.getMonth() + 1).padStart(2, "0"), String(generatedAt.getDate()).padStart(2, "0")].join("-");
  const blob = pdf.output("blob");
  onProgress?.({ completed: total, total, label: "Your PDF is ready." });
  return {
    blob,
    filename: `sacred-connection-catalog-${localDate}.pdf`,
    productCount: selected.length,
    generatedAt,
    generatedAtLabel,
  };
}

export function saveCatalogPdf({ blob, filename }) {
  if (!(blob instanceof Blob)) throw new Error("Generate the PDF before downloading it.");
  const url = URL.createObjectURL(blob);
  const mobile = navigator.userAgentData?.mobile === true || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (mobile) {
    // The browser PDF viewer provides Share / Save to Files on iOS and Android.
    const preview = window.open(url, "_blank");
    if (!preview) window.location.assign(url);
  } else {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename || "sacred-connection-catalog.pdf";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), mobile ? 300000 : 10000);
}

async function generateLegacyPdf(options) {
  const products = options.products || await loadPdfCatalog();
  const selected = products.filter((product) => {
    const taxonomy = getCatalogTaxonomy(product);
    const category = normal(options.category);
    const tribe = normal(options.tribe);
    const query = normal(options.search);
    return (!category || [normal(product.category), normal(taxonomy.mainCategory)].includes(category)) &&
      (!tribe || [normal(product.tribe), normal(taxonomy.subcategory)].includes(tribe)) &&
      (!query || normal(`${product.name} ${product.sku}`).includes(query));
  });
  return generateCatalogPdf({ ...options, products: selected });
}

export async function createDigitalCatalogPdfPreview(options = {}) {
  return generateLegacyPdf(options);
}

export async function downloadDigitalCatalogPdf(options = {}) {
  saveCatalogPdf(await generateLegacyPdf(options));
}
