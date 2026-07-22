"use client";

import { optionPriceForUser } from "@/lib/pricing";

const BRAND_DARK = "FF1A1A1A";
const BRAND_GREEN = "FF268072";
const BRAND_MINT = "FF82D6C5";
const BRAND_RED = "FFEC2300";

const DEFAULT_ETHNICITY_COLOR = [38, 128, 114];
const ETHNICITY_COLORS = {
  apurina: [74, 115, 13],
  "apurina\u00a3": [74, 115, 13],
  caboclo: [64, 39, 30],
  "huni kuin": [166, 114, 68],
  katukina: [33, 64, 1],
  kuntanawa: [84, 87, 92],
  nukini: [224, 154, 30],
  puyanawa: [64, 44, 35],
  shanenawa: [3, 103, 166],
  shawadawa: [115, 20, 20],
  "shawa\u00a3dawa": [115, 20, 20],
  yawanawa: [191, 126, 4],
  shamanic: [104, 104, 73],
  "shamanic tobacco free": [29, 119, 115],
};

function normalizeEthnicity(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function ethnicityColor(product) {
  return ETHNICITY_COLORS[normalizeEthnicity(product.tribe)] || DEFAULT_ETHNICITY_COLOR;
}

function mixWithWhite(color, amount) {
  return color.map((channel) => Math.round(channel + (255 - channel) * amount));
}

function relativeLuminance(color) {
  const channels = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function buttonTextColor(background) {
  const luminance = relativeLuminance(background);
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.06;
  return whiteContrast >= darkContrast ? [255, 255, 255] : [26, 26, 26];
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const safeFilenameDate = () => new Date().toISOString().slice(0, 10);

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function usesMobilePdfPreview() {
  const userAgentDataMobile = navigator.userAgentData?.mobile === true;
  const mobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  const touchEnabledIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return userAgentDataMobile || mobileUserAgent || touchEnabledIpad;
}

export function prepareCatalogPdfDownload() {
  if (!usesMobilePdfPreview()) return null;

  // Mobile browsers can reject a download started after the catalog data and
  // images have finished loading because the original tap is no longer active.
  // Reserve a tab synchronously and navigate it to the finished PDF later.
  const previewWindow = window.open("", "_blank");
  if (previewWindow) {
    previewWindow.document.title = "Preparing Sacred Connection catalog";
    previewWindow.document.body.textContent = "Preparing your PDF catalog...";
    previewWindow.document.body.style.cssText =
      "margin:0;min-height:100vh;display:grid;place-items:center;background:#23403b;color:#fff;font:600 16px system-ui,sans-serif;text-align:center;padding:24px;box-sizing:border-box";
  }
  return previewWindow;
}

function deliverPdf(pdf, filename, previewWindow) {
  const blob = pdf.output("blob");

  if (previewWindow && !previewWindow.closed) {
    const url = URL.createObjectURL(blob);
    previewWindow.location.replace(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  downloadBlob(blob, filename);
}

function catalogRows(products, user) {
  return products.flatMap((product) => {
    const options = product.options?.length ? product.options : [{}];
    return options.map((option) => ({
      sku: option.sku || product.sku || "",
      product: product.name || "",
      category: product.category || "",
      option: option.name || "Default",
      weight: Number(option.weightGrams) || null,
      price: optionPriceForUser(option, user, product.category),
      description: "",
      productUrl: product.productUrl || "",
    }));
  });
}

export async function exportCatalogExcel({ products, user, includeLinks }) {
  const ExcelJS = await import("exceljs");
  const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
  const workbook = new Workbook();
  workbook.creator = "Sacred Connection Wholesale";
  workbook.created = new Date();
  workbook.modified = new Date();

  const instructions = workbook.addWorksheet("Instructions", {
    views: [{ showGridLines: false }],
  });
  instructions.columns = [
    { width: 4 },
    { width: 24 },
    { width: 76 },
  ];
  instructions.mergeCells("B2:C2");
  instructions.getCell("B2").value = "SACRED CONNECTION - ORDER WORKBOOK";
  instructions.getCell("B2").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  instructions.getCell("B2").fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
  instructions.getCell("B2").alignment = { vertical: "middle" };
  instructions.getRow(2).height = 36;

  const guidance = [
    ["1", "Open the Order sheet and locate products by SKU, name, category, or option."],
    ["2", "Enter the desired amount only in the Quantidade column. Keep SKU values unchanged."],
    ["3", "Use Descricao for an optional note about that line."],
    ["4", "Rows with quantity zero are ignored when the order file is imported."],
    ["5", "Save this workbook. CSV order import will be enabled in the next catalog phase."],
  ];
  instructions.getCell("B4").value = "HOW TO USE";
  instructions.getCell("B4").font = { bold: true, color: { argb: BRAND_GREEN } };
  guidance.forEach(([step, text], index) => {
    const row = 5 + index;
    instructions.getCell(row, 2).value = step;
    instructions.getCell(row, 2).font = { bold: true, color: { argb: BRAND_RED } };
    instructions.getCell(row, 3).value = text;
    instructions.getCell(row, 3).alignment = { wrapText: true, vertical: "top" };
    instructions.getRow(row).height = 27;
  });
  instructions.getCell("B12").value = "Generated";
  instructions.getCell("C12").value = new Date();
  instructions.getCell("C12").numFmt = "yyyy-mm-dd hh:mm";

  const sheet = workbook.addWorksheet("Order", {
    views: [{ state: "frozen", ySplit: 5, showGridLines: false }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  sheet.columns = [
    { key: "sku", width: 24 },
    { key: "quantity", width: 14 },
    { key: "description", width: 28 },
    { key: "product", width: 42 },
    { key: "category", width: 22 },
    { key: "option", width: 22 },
    { key: "weight", width: 13 },
    { key: "price", width: 19 },
    { key: "subtotal", width: 19 },
    { key: "link", width: 18 },
  ];

  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "SACRED CONNECTION WHOLESALE ORDER";
  sheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getRow(1).height = 38;

  sheet.mergeCells("A2:J2");
  sheet.getCell("A2").value = "Fill only Quantidade and Descricao. Do not change SKU values.";
  sheet.getCell("A2").font = { italic: true, color: { argb: "FF4F625D" } };
  sheet.getCell("A2").alignment = { vertical: "middle" };
  sheet.getRow(2).height = 25;

  sheet.getCell("A3").value = "Products / variations";
  sheet.getCell("B3").value = catalogRows(products, user).length;
  sheet.getCell("D3").value = "Catalog products";
  sheet.getCell("E3").value = products.length;
  ["A3", "D3"].forEach((address) => {
    sheet.getCell(address).font = { bold: true, color: { argb: BRAND_GREEN } };
  });

  const headers = [
    "SKU",
    "Quantidade",
    "Descricao",
    "Produto",
    "Categoria",
    "Opcao",
    "Peso (g)",
    "Preco unitario (USD)",
    "Subtotal (USD)",
    "Produto no site",
  ];
  sheet.getRow(5).values = headers;
  sheet.getRow(5).height = 30;
  sheet.getRow(5).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_GREEN } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: BRAND_MINT } } };
  });

  const rows = catalogRows(products, user);
  rows.forEach((item, index) => {
    const rowNumber = index + 6;
    const row = sheet.getRow(rowNumber);
    row.values = [
      item.sku,
      0,
      item.description,
      item.product,
      item.category,
      item.option,
      item.weight,
      item.price,
      { formula: `IF(B${rowNumber}>0,B${rowNumber}*H${rowNumber},"")` },
      "",
    ];
    row.height = 24;
    row.alignment = { vertical: "middle" };
    row.getCell(1).numFmt = "@";
    row.getCell(2).numFmt = "0";
    row.getCell(2).dataValidation = {
      type: "whole",
      operator: "between",
      allowBlank: true,
      formulae: [0, 99999],
      showErrorMessage: true,
      errorTitle: "Invalid quantity",
      error: "Enter a whole number equal to or greater than zero.",
    };
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2CC" } };
    row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9E8" } };
    row.getCell(8).numFmt = '"$"#,##0.00';
    row.getCell(9).numFmt = '"$"#,##0.00';
    if (includeLinks && item.productUrl) {
      row.getCell(10).value = {
        text: "Open product",
        hyperlink: new URL(item.productUrl, window.location.origin).href,
      };
      row.getCell(10).font = { color: { argb: BRAND_GREEN }, underline: true };
    } else {
      row.getCell(10).value = "Login required";
      row.getCell(10).font = { italic: true, color: { argb: "FF7A7A7A" } };
    }
    if (index % 2 === 1) {
      [1, 4, 5, 6, 7, 8, 9, 10].forEach((column) => {
        row.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F7F6" } };
      });
    }
  });

  const firstDataRow = 6;
  const lastDataRow = Math.max(firstDataRow, rows.length + 5);
  const totalRow = lastDataRow + 2;
  sheet.getCell(totalRow, 1).value = "ORDER TOTAL";
  sheet.getCell(totalRow, 1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getCell(totalRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_DARK } };
  sheet.getCell(totalRow, 2).value = { formula: `SUM(B${firstDataRow}:B${lastDataRow})` };
  sheet.getCell(totalRow, 2).font = { bold: true };
  sheet.getCell(totalRow, 9).value = { formula: `SUM(I${firstDataRow}:I${lastDataRow})` };
  sheet.getCell(totalRow, 9).font = { bold: true, color: { argb: BRAND_RED } };
  sheet.getCell(totalRow, 9).numFmt = '"$"#,##0.00';
  sheet.autoFilter = { from: "A5", to: `J${lastDataRow}` };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `sacred-connection-order-${safeFilenameDate()}.xlsx`
  );
}

function productPrice(product) {
  const min = Number(product.priceMin) || 0;
  const max = Number(product.priceMax) || min;
  return min === max ? money.format(min) : `${money.format(min)} - ${money.format(max)}`;
}

function productPriceForUser(product, user) {
  const prices = (product.options || [])
    .map((option) => optionPriceForUser(option, user, product.category))
    .map(Number)
    .filter((price) => Number.isFinite(price));
  if (!prices.length) return productPrice(product);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? money.format(min) : `${money.format(min)} - ${money.format(max)}`;
}

const pdfSafeText = (value) => {
  const normalized = String(value ?? "")
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u00A0\u2007\u202F]/g, " ")
    .replace(/[\u2022\u00B7]/g, "-");
  return Array.from(normalized, (character) => {
    if (character.codePointAt(0) <= 255) return character;
    const latinFallback = character
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\u0020-\u00ff]/g, "");
    return latinFallback || "?";
  }).join("");
};

function plainPdfText(value) {
  if (!value) return "";
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value).replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n");
  return pdfSafeText(textarea.value.replace(/<[^>]*>/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim());
}

async function fetchPdfAsset(url, { cache = "force-cache" } = {}) {
  const response = await fetch(url, { cache });
  if (!response.ok) throw new Error(`PDF asset failed with status ${response.status}.`);
  return new Uint8Array(await response.arrayBuffer());
}

async function fetchPdfProductImage(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`PDF product image failed with status ${response.status}.`);
  const payload = await response.json();
  if (payload?.format !== "PNG" || typeof payload.base64 !== "string" || !payload.base64) {
    throw new Error("PDF product image payload is invalid.");
  }
  return {
    dataUrl: `data:image/png;base64,${payload.base64}`,
    format: "PNG",
  };
}

function truncatePdfLines(pdf, text, width, maxLines = 2) {
  const lines = pdf.splitTextToSize(pdfSafeText(text), width);
  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  const finalLine = visible[maxLines - 1];
  visible[maxLines - 1] = `${finalLine.slice(0, Math.max(1, finalLine.length - 3))}...`;
  return visible;
}

function drawCatalogLogo(pdf, logo, x, y, width = 45) {
  if (logo) {
    pdf.addImage(logo, "PNG", x, y, width, width * 0.36, "catalog-logo", "FAST");
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(width / 4);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Sacred Connection", x, y + width * 0.22);
  }
}

function drawGreenCoverBackground(pdf, background) {
  if (!background) return;
  pdf.addImage(background, "PNG", 0, 0, 210, 297, "catalog-cover-background", "FAST");
}

function drawCoverDecoration(pdf, decoration) {
  if (!decoration) return;
  pdf.addImage(decoration, "PNG", 105, 0, 105, 42, "catalog-cover-decoration", "FAST");
}

const contactIconSvg = (content) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;

const CONTACT_ICON_SVGS = {
  email: contactIconSvg(
    '<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/><rect x="2" y="4" width="20" height="16" rx="2"/>'
  ),
  phone: contactIconSvg(
    '<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>'
  ),
  location: contactIconSvg(
    '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>'
  ),
};

function svgIconToPng(svg) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 192;
      canvas.height = 192;
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas is unavailable for PDF contact icons."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("PDF contact icon could not be rendered."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function loadContactIcons() {
  const entries = await Promise.all(
    Object.entries(CONTACT_ICON_SVGS).map(async ([type, svg]) => [type, await svgIconToPng(svg)])
  );
  return Object.fromEntries(entries);
}

function drawContactIcon(pdf, type, x, y, contactIcons) {
  const icon = contactIcons[type];
  if (icon) pdf.addImage(icon, "PNG", x, y, 7.5, 7.5, `catalog-contact-${type}`, "FAST");
}

function drawCoverContactInfo(pdf, contactIcons) {
  const iconX = 116;
  const textX = 128;

  const rows = [
    {
      type: "email",
      values: ["info@sacredconnection.co"],
      y: 238,
      url: "mailto:info@sacredconnection.co",
      linkHeight: 10,
    },
    {
      type: "phone",
      values: ["+1 (818) 306-0568"],
      y: 251.5,
      url: "tel:+18183060568",
      linkHeight: 10,
    },
    {
      type: "location",
      values: ["2301 Stampede Ave", "Cody, WY - 82414", "USA"],
      y: 265,
      url: "https://www.google.com/maps/search/?api=1&query=2301+Stampede+Ave+Cody+WY+82414+USA",
      linkHeight: 19,
    },
  ];

  rows.forEach((row) => {
    drawContactIcon(pdf, row.type, iconX, row.y, contactIcons);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6.7);
    pdf.setTextColor(255, 255, 255);
    row.values.forEach((value, index) => {
      pdf.text(value, textX, row.y + 5.2 + index * 4.5);
    });
    pdf.link(iconX - 1, row.y - 1, 79, row.linkHeight, { url: row.url });
  });
}

function drawPdfCover(pdf, logo, coverBackground, coverDecoration, contactIcons, products, filterLabel) {
  const categoryCount = new Set(products.map((product) => product.category).filter(Boolean)).size;
  const tribeCount = new Set(products.map((product) => product.tribe).filter(Boolean)).size;
  pdf.setFillColor(20, 65, 57);
  pdf.rect(0, 0, 210, 297, "F");
  drawGreenCoverBackground(pdf, coverBackground);
  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, 210, 42, "F");
  drawCoverDecoration(pdf, coverDecoration);
  drawCatalogLogo(pdf, logo, 16, 12, 52);

  pdf.setDrawColor(130, 214, 197);
  pdf.setLineWidth(0.6);
  pdf.line(16, 74, 54, 74);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(130, 214, 197);
  pdf.text("INTERACTIVE DIGITAL CATALOG", 16, 68);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(31);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Wholesale", 16, 101);
  pdf.text("Rapé Catalog", 16, 116);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(218, 235, 230);
  pdf.text(
    truncatePdfLines(
      pdf,
      "A curated guide to Sacred Connection blends, indigenous traditions, formats, SKUs, and wholesale prices.",
      130,
      4
    ),
    16,
    134,
    { lineHeightFactor: 1.45 }
  );

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(16, 180, 178, 48, 2.5, 2.5, "F");
  const stats = [
    [String(products.length), "RAPÉS"],
    [String(categoryCount), "COLLECTIONS"],
    [String(tribeCount), "TRIBES"],
  ];
  stats.forEach(([value, label], index) => {
    const x = 45 + index * 59;
    if (index) {
      pdf.setDrawColor(220, 229, 226);
      pdf.line(x - 29, 191, x - 29, 217);
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(38, 128, 114);
    pdf.text(value, x, 201, { align: "center" });
    pdf.setFontSize(7);
    pdf.setTextColor(83, 105, 98);
    pdf.text(label, x, 213, { align: "center" });
  });

  drawCoverContactInfo(pdf, contactIcons);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(180, 211, 202);
  pdf.text(pdfSafeText(filterLabel || "Complete catalog"), 16, 250);
  pdf.text(`Generated ${safeFilenameDate()}`, 16, 257);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("SACRED CONNECTION WHOLESALE", 16, 278);
}

function drawGridHeader(pdf, logo, category, pageNumber, pageCount) {
  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, 210, 28, "F");
  drawCatalogLogo(pdf, logo, 12, 6.5, 36);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.5);
  pdf.setTextColor(130, 214, 197);
  pdf.text(pdfSafeText(category).toUpperCase(), 198, 12, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(190, 201, 198);
  pdf.text(`DIGITAL CATALOG  |  ${pageNumber}/${pageCount}`, 198, 19, { align: "right" });
}

function drawCategoryCover(
  pdf,
  logo,
  coverBackground,
  coverDecoration,
  category,
  products,
  categoryIndex,
  pageNumber,
  pageCount
) {
  const tribes = [...new Set(products.map((product) => product.tribe).filter(Boolean))];
  pdf.setFillColor(categoryIndex % 2 ? 26 : 20, categoryIndex % 2 ? 26 : 65, categoryIndex % 2 ? 26 : 57);
  pdf.rect(0, 0, 210, 297, "F");
  if (categoryIndex % 2 === 0) drawGreenCoverBackground(pdf, coverBackground);
  drawCoverDecoration(pdf, coverDecoration);
  drawCatalogLogo(pdf, logo, 16, 14, 50);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(130, 214, 197);
  pdf.text(`COLLECTION ${String(categoryIndex + 1).padStart(2, "0")}`, 16, 76);
  pdf.setDrawColor(130, 214, 197);
  pdf.setLineWidth(0.7);
  pdf.line(16, 82, 54, 82);
  pdf.setFontSize(29);
  pdf.setTextColor(255, 255, 255);
  pdf.text(truncatePdfLines(pdf, category, 168, 3), 16, 108, { lineHeightFactor: 1.08 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(218, 235, 230);
  const collectionDescription = category === "Rapé Indigenous"
    ? "Traditional rapé blends organized by their source tribe and the product information available in the wholesale catalog."
    : "Sacred Connection blends presented with their wholesale formats, product identifiers, and catalog descriptions.";
  pdf.text(truncatePdfLines(pdf, collectionDescription, 145, 4), 16, 139, { lineHeightFactor: 1.45 });

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(16, 180, 178, 48, 2.5, 2.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(21);
  pdf.setTextColor(38, 128, 114);
  pdf.text(String(products.length), 42, 201, { align: "center" });
  pdf.setFontSize(7);
  pdf.setTextColor(83, 105, 98);
  pdf.text("PRODUCTS", 42, 213, { align: "center" });
  pdf.setDrawColor(220, 229, 226);
  pdf.line(68, 190, 68, 218);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(83, 105, 98);
  pdf.text(
    truncatePdfLines(pdf, tribes.length ? `Tribes: ${tribes.join(", ")}` : "Sacred Connection collection", 113, 4),
    78,
    195,
    { lineHeightFactor: 1.35 }
  );
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(255, 255, 255);
  pdf.text("CLICK ANY PRODUCT TO CONTINUE ONLINE", 16, 264);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 211, 202);
  pdf.text(`Page ${pageNumber} of ${pageCount}`, 16, 276);
}

function pdfProductTarget(product, includeLinks) {
  const productionOrigin = process.env.NEXT_PUBLIC_SITE_URL ||
    (window.location.hostname === "localhost"
      ? "https://sacred-connection-wholesale.vercel.app"
      : window.location.origin);
  const productUrl = new URL(product.productUrl || "/catalog", productionOrigin);
  if (includeLinks) return productUrl.href;
  const loginUrl = new URL("/my-account", productionOrigin);
  loginUrl.searchParams.set("redirect", productUrl.pathname + productUrl.search);
  return loginUrl.href;
}

function drawGridProductCard(pdf, product, image, user, includeLinks, x, y) {
  const width = 90;
  const height = 108;
  const accent = ethnicityColor(product);
  const accentSoft = mixWithWhite(accent, 0.92);
  const accentBorder = mixWithWhite(accent, 0.72);
  const buttonText = buttonTextColor(accent);
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(...accentBorder);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(x, y, width, height, 1.8, 1.8, "FD");

  pdf.setFillColor(239, 244, 242);
  pdf.roundedRect(x + 4, y + 5, 30, 30, 1.2, 1.2, "F");
  if (image?.dataUrl && image?.format) {
    pdf.addImage(
      image.dataUrl,
      image.format,
      x + 4,
      y + 5,
      30,
      30,
      `catalog-product-${pdfSafeText(product.id || product.sku || product.name)}`,
      "FAST"
    );
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(...accent);
    pdf.text(String(product.name || "?").charAt(0).toUpperCase(), x + 19, y + 23, { align: "center" });
  }

  const identityX = x + 38;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.8);
  pdf.setTextColor(...accent);
  pdf.text(pdfSafeText(product.tribe || product.category || "COLLECTION").toUpperCase(), identityX, y + 8);
  pdf.setFontSize(9.2);
  pdf.setTextColor(26, 26, 26);
  pdf.text(truncatePdfLines(pdf, product.name, 48, 3), identityX, y + 14, { lineHeightFactor: 1.05 });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.8);
  pdf.setTextColor(113, 128, 123);
  pdf.text(`SKU ${pdfSafeText(product.sku || "-")}`, identityX, y + 30.5);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7.8);
  pdf.setTextColor(...accent);
  pdf.text(productPriceForUser(product, user), identityX, y + 36);

  pdf.setDrawColor(220, 229, 226);
  pdf.line(x + 4, y + 41, x + width - 4, y + 41);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.8);
  pdf.setTextColor(...accent);
  pdf.text("DESCRIPTION", x + 4, y + 47);
  const description = plainPdfText(product.description) || "Description not provided in the source catalog.";
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.2);
  pdf.setTextColor(65, 80, 75);
  pdf.text(truncatePdfLines(pdf, description, 82, 5), x + 4, y + 53, { lineHeightFactor: 1.25 });

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.8);
  pdf.setTextColor(...accent);
  pdf.text("WEIGHT / PRICE", x + 4, y + 77.5);

  const tableOptions = product.options?.length
    ? product.options
    : [{ name: "Default", price: product.priceMin || 0 }];
  const tableX = x + 4;
  const tableY = y + 80.5;
  const columnCount = 5;
  const columnGap = 1;
  const rowGap = 0.8;
  const cellWidth = (82 - columnGap * (columnCount - 1)) / columnCount;
  const cellHeight = 6.2;
  tableOptions.forEach((option, index) => {
    const column = index % columnCount;
    const row = Math.floor(index / columnCount);
    const cellX = tableX + column * (cellWidth + columnGap);
    const cellY = tableY + row * (cellHeight + rowGap);
    const weightLabel = option.weightGrams
      ? `${option.weightGrams}g`
      : pdfSafeText(option.name || "Default");
    const optionPrice = money.format(optionPriceForUser(option, user, product.category));

    pdf.setFillColor(...accentSoft);
    pdf.setDrawColor(...accentBorder);
    pdf.setLineWidth(0.2);
    pdf.roundedRect(cellX, cellY, cellWidth, cellHeight, 0.7, 0.7, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(3.9);
    pdf.setTextColor(...accent);
    pdf.text(weightLabel, cellX + cellWidth / 2, cellY + 2.45, { align: "center" });
    pdf.setFontSize(4.2);
    pdf.setTextColor(35, 62, 55);
    pdf.text(optionPrice, cellX + cellWidth / 2, cellY + 5.05, { align: "center" });
  });

  pdf.setFillColor(...accent);
  pdf.roundedRect(x + 4, y + 96, width - 8, 8, 1, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.8);
  pdf.setTextColor(...buttonText);
  pdf.text(includeLinks ? "VIEW PRODUCT" : "LOGIN TO VIEW PRODUCT", x + 8, y + 101.3);
  pdf.text(`${product.options?.length || 1} OPTIONS  >`, x + width - 8, y + 101.3, { align: "right" });
  pdf.link(x, y, width, height, { url: pdfProductTarget(product, includeLinks) });
}

function drawGridFooter(pdf, category, pageNumber, pageCount) {
  pdf.setDrawColor(220, 229, 226);
  pdf.line(12, 282, 198, 282);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(113, 128, 123);
  pdf.text("Sacred Connection Wholesale", 12, 288);
  pdf.text(`${pdfSafeText(category)}  |  ${pageNumber}/${pageCount}`, 198, 288, { align: "right" });
}

function drawGridPage(pdf, { products, images, logo, user, includeLinks, category, pageNumber, pageCount }) {
  drawGridHeader(pdf, logo, category, pageNumber, pageCount);
  products.forEach((product, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    drawGridProductCard(pdf, product, images[index], user, includeLinks, 12 + column * 96, 39 + row * 117);
  });
  drawGridFooter(pdf, category, pageNumber, pageCount);
}

function buildIndexRows(categoryGroups) {
  const rows = [];
  categoryGroups.forEach((group) => {
    rows.push({ type: "category", label: group.category, height: 9 });
    const ethnicityNames = [...new Set(group.products.map((product) => product.tribe || group.category))]
      .sort((a, b) => a.localeCompare(b));
    ethnicityNames.forEach((ethnicity) => {
      rows.push({ type: "ethnicity", label: ethnicity, height: 7 });
      group.products
        .filter((product) => (product.tribe || group.category) === ethnicity)
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
        .forEach((product) => rows.push({ type: "product", product, height: 5.2 }));
    });
  });
  return rows;
}

function paginateIndexRows(rows) {
  const columnHeight = 232;
  const pages = [];
  let page = [[], []];
  let column = 0;
  let usedHeight = 0;

  const advanceColumn = () => {
    if (column === 0) {
      column = 1;
    } else {
      pages.push(page);
      page = [[], []];
      column = 0;
    }
    usedHeight = 0;
  };

  rows.forEach((row, index) => {
    const nextHeight = rows[index + 1]?.height || 0;
    const keepWithNext = row.type !== "product" ? nextHeight : 0;
    if (usedHeight + row.height + keepWithNext > columnHeight) advanceColumn();
    page[column].push(row);
    usedHeight += row.height;
  });
  if (page[0].length || page[1].length) pages.push(page);

  const lastPage = pages[pages.length - 1];
  if (lastPage?.[0].length && !lastPage[1].length) {
    const totalHeight = lastPage[0].reduce((total, row) => total + row.height, 0);
    const targetHeight = totalHeight / 2;
    let runningHeight = 0;
    let bestSplit = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    lastPage[0].forEach((row, index) => {
      const previous = lastPage[0][index - 1];
      const isGroupStart = row.type === "category" || (row.type === "ethnicity" && previous?.type !== "category");
      if (index > 0 && isGroupStart) {
        const distance = Math.abs(runningHeight - targetHeight);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestSplit = index;
        }
      }
      runningHeight += row.height;
    });
    if (bestSplit > 0) lastPage[1] = lastPage[0].splice(bestSplit);
  }
  return pages;
}

function drawIndexPage(pdf, { columns, logo, productDestinations, pageNumber, pageCount, indexPage, indexPageCount }) {
  pdf.setFillColor(26, 26, 26);
  pdf.rect(0, 0, 210, 28, "F");
  drawCatalogLogo(pdf, logo, 12, 6.5, 36);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(130, 214, 197);
  pdf.text("INDEX", 198, 12, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(190, 201, 198);
  pdf.text(`PRODUCT DIRECTORY  |  ${indexPage}/${indexPageCount}`, 198, 19, { align: "right" });
  pdf.setDrawColor(220, 229, 226);
  pdf.setLineWidth(0.25);
  pdf.line(103, 38, 103, 274);

  columns.forEach((rows, columnIndex) => {
    const x = columnIndex === 0 ? 12 : 108;
    const width = 90;
    let y = 38;
    let productRow = 0;
    rows.forEach((row) => {
      if (row.type === "category") {
        pdf.setFillColor(20, 65, 57);
        pdf.roundedRect(x, y, width, 7.5, 1, 1, "F");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.text(pdfSafeText(row.label).toUpperCase(), x + 3, y + 5);
      } else if (row.type === "ethnicity") {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.5);
        pdf.setTextColor(38, 128, 114);
        pdf.text(pdfSafeText(row.label).toUpperCase(), x + 2, y + 4.8);
        pdf.setDrawColor(220, 229, 226);
        pdf.line(x + 2, y + 6.2, x + width - 2, y + 6.2);
      } else {
        if (productRow % 2 === 0) {
          pdf.setFillColor(244, 248, 247);
          pdf.rect(x, y, width, row.height, "F");
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.2);
        pdf.setTextColor(45, 62, 57);
        pdf.text(truncatePdfLines(pdf, row.product.name, 65, 1), x + 2, y + 3.6);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(5.7);
        pdf.setTextColor(38, 128, 114);
        pdf.text(pdfSafeText(row.product.sku || "-"), x + width - 2, y + 3.6, { align: "right" });
        const destination = productDestinations.get(row.product);
        if (destination) {
          pdf.link(x, y, width, row.height, {
            pageNumber: destination.pageNumber,
            top: destination.top,
            zoom: 1,
          });
        }
        productRow += 1;
      }
      y += row.height;
    });
  });

  pdf.setDrawColor(220, 229, 226);
  pdf.line(12, 282, 198, 282);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6);
  pdf.setTextColor(113, 128, 123);
  pdf.text("Sacred Connection Wholesale", 12, 288);
  pdf.text(`Index  |  ${pageNumber}/${pageCount}`, 198, 288, { align: "right" });
}

export async function exportCatalogPdf({
  products,
  user,
  includeLinks,
  filterLabel,
  previewWindow = null,
}) {
  const { jsPDF } = await import("jspdf");
  const preferredCategories = ["Rapé Indigenous", "Sacred Connection"];
  const categories = [...new Set(products.map((product) => product.category || "Other"))].sort(
    (a, b) => {
      const aIndex = preferredCategories.indexOf(a);
      const bIndex = preferredCategories.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
  );
  const categoryGroups = categories.map((category) => ({
    category,
    products: products.filter((product) => (product.category || "Other") === category),
  }));
  const indexPages = paginateIndexRows(buildIndexRows(categoryGroups));
  const pageCount = 1 + indexPages.length + categoryGroups.length + categoryGroups.reduce(
    (total, group) => total + Math.ceil(group.products.length / 4),
    0
  );
  const productDestinations = new Map();
  let destinationPage = 1 + indexPages.length;
  categoryGroups.forEach((group) => {
    destinationPage += 1;
    for (let start = 0; start < group.products.length; start += 4) {
      destinationPage += 1;
      group.products.slice(start, start + 4).forEach((product, index) => {
        productDestinations.set(product, {
          pageNumber: destinationPage,
          top: 35 + Math.floor(index / 2) * 117,
        });
      });
    }
  });
  const pdf = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
    putOnlyUsedFonts: true,
  });
  pdf.setDisplayMode("100%", "continuous", "UseNone");
  pdf.setProperties({
    title: "Sacred Connection Wholesale Catalog",
    subject: "Interactive wholesale product catalog",
    author: "Sacred Connection Wholesale",
    creator: "Sacred Connection Digital Catalog",
  });

  let logo = null;
  try {
    logo = await fetchPdfAsset("/logo-pdf.png?v=transparent-20260721");
  } catch {
    // A text fallback is drawn when the local brand asset cannot be loaded.
  }

  let coverBackground = null;
  try {
    coverBackground = await fetchPdfAsset("/catalog-cover-background/catalog-cover-background.png", {
      cache: "no-store",
    });
  } catch {
    // The green covers remain solid until the optional background file is added.
  }

  let coverDecoration = null;
  try {
    coverDecoration = await fetchPdfAsset(
      "/catalog-cover-decoration/catalog-cover-decoration.png",
      { cache: "no-store" }
    );
  } catch {
    // The black cover bar remains clean until the optional decoration is added.
  }

  let contactIcons = {};
  try {
    contactIcons = await loadContactIcons();
  } catch {
    // Contact text and links remain available if an icon cannot be rendered.
  }

  const imageCache = new Map();
  const loadProductImage = (product) => {
    if (!product.image) return Promise.resolve(null);
    if (!imageCache.has(product.image)) {
      const proxyUrl = `/api/catalog/image?url=${encodeURIComponent(product.image)}&v=base64-json-v3`;
      imageCache.set(
        product.image,
        fetchPdfProductImage(proxyUrl).catch(() => null)
      );
    }
    return imageCache.get(product.image);
  };

  const productImages = [];
  const imageBatchSize = 12;
  for (let batchStart = 0; batchStart < products.length; batchStart += imageBatchSize) {
    const batch = products.slice(batchStart, batchStart + imageBatchSize);
    productImages.push(...(await Promise.all(batch.map(loadProductImage))));
  }
  const imagesByProduct = new Map(products.map((product, index) => [product.id || product.sku, productImages[index]]));
  drawPdfCover(pdf, logo, coverBackground, coverDecoration, contactIcons, products, filterLabel);
  let currentPage = 1;
  indexPages.forEach((columns, indexPage) => {
    pdf.addPage("a4", "portrait");
    currentPage += 1;
    drawIndexPage(pdf, {
      columns,
      logo,
      productDestinations,
      pageNumber: currentPage,
      pageCount,
      indexPage: indexPage + 1,
      indexPageCount: indexPages.length,
    });
  });
  categoryGroups.forEach((group, categoryIndex) => {
    pdf.addPage("a4", "portrait");
    currentPage += 1;
    drawCategoryCover(
      pdf,
      logo,
      coverBackground,
      coverDecoration,
      group.category,
      group.products,
      categoryIndex,
      currentPage,
      pageCount
    );
    for (let start = 0; start < group.products.length; start += 4) {
      const pageProducts = group.products.slice(start, start + 4);
      pdf.addPage("a4", "portrait");
      currentPage += 1;
      drawGridPage(pdf, {
        products: pageProducts,
        images: pageProducts.map((product) => imagesByProduct.get(product.id || product.sku) || null),
        logo,
        user,
        includeLinks,
        category: group.category,
        pageNumber: currentPage,
        pageCount,
      });
    }
  });

  deliverPdf(
    pdf,
    `sacred-connection-catalog-${safeFilenameDate()}.pdf`,
    previewWindow
  );
}
