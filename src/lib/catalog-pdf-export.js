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
  const total = selected.length;
  onProgress?.({ completed: 0, total, label: "Preparing your selected products..." });
  const { jsPDF } = await import("jspdf");
  const pdf = renderCatalogListPdf({
    jsPDF,
    groups: groupCatalogProducts(selected),
    generatedAt,
    generatedAtLabel,
    filterLabel,
    includePrices: Boolean(user),
    onProductRendered: (count) => onProgress?.({
      completed: count,
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
