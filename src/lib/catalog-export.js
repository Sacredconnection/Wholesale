"use client";

import {
  MAX_ORDER_ITEM_QUANTITY,
  getOrderableProductOptions,
  maximumOrderQuantity,
  optionPriceForUser,
  orderableStockQuantity,
  quantityStepForWeight,
} from "@/lib/pricing";
import {
  catalogOrderItemToken,
  ORDER_ITEM_HEADER,
  ORDER_QUANTITY_HEADER,
  ORDER_WORKBOOK_MARKER,
  ORDER_WORKBOOK_META_SHEET,
  ORDER_WORKBOOK_VERSION,
} from "@/lib/catalog-order-workbook";
import { catalogProductTitle, groupCatalogProducts } from "@/lib/catalog-taxonomy";

const BRAND_GREEN = "FF268072";
const CATALOG_GRID_COLOR = "FFD5DEDB";

const catalogGridBorder = () => ({
  top: { style: "thin", color: { argb: CATALOG_GRID_COLOR } },
  left: { style: "thin", color: { argb: CATALOG_GRID_COLOR } },
  bottom: { style: "thin", color: { argb: CATALOG_GRID_COLOR } },
  right: { style: "thin", color: { argb: CATALOG_GRID_COLOR } },
});

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

const excelArgb = (color) =>
  `FF${color
    .map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;

const twoDigits = (value) => String(value).padStart(2, "0");

const safeFilenameDate = (date = new Date()) =>
  `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(
    date.getDate()
  )}`;

const clientGenerationContext = (date = new Date()) => {
  const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZone = resolvedTimeZone || "Client local time";
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const utcOffset = `UTC${offsetSign}${twoDigits(
    Math.floor(absoluteOffset / 60)
  )}:${twoDigits(absoluteOffset % 60)}`;
  const localDateTime = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
  }).format(date);

  return {
    date,
    timeZone,
    utcOffset,
    label: `${localDateTime} (${timeZone}, ${utcOffset})`,
  };
};

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

function catalogRows(products, user) {
  return products.flatMap((product) => {
    const options = getOrderableProductOptions(product);

    return options.map((option) => {
      const hasKnownStock =
        option.stockQuantity != null &&
        option.stockQuantity !== "" &&
        Number.isFinite(Number(option.stockQuantity));

      return {
        productId: product.id || "",
        product: catalogProductTitle(product),
        sku: option.sku || "",
        option: option.name || "Single format",
        weight: Number.isFinite(Number(option.weightGrams))
          ? Number(option.weightGrams)
          : null,
        availability: option.availabilityLabel || (
          option.inStock === false
            ? "Out of stock — available to order"
            : option.backordersAllowed && hasKnownStock && Number(option.stockQuantity) === 0
              ? "Available on backorder"
              : hasKnownStock
                ? (() => {
                    const quantityStep = quantityStepForWeight(option.weightGrams);
                    const orderableQuantity = orderableStockQuantity(option) || 0;
                    if (quantityStep === 1) return `${orderableQuantity} in stock`;
                    const packs = orderableQuantity / quantityStep;
                    return `${packs} ${packs === 1 ? "pack" : "packs"} available (${quantityStep} units per pack)`;
                  })()
                : "In stock"),
        inStock: option.inStock !== false,
        backordersAllowed: option.backordersAllowed === true,
        stockQuantity: hasKnownStock ? Number(option.stockQuantity) : null,
        maximumQuantity: maximumOrderQuantity(option),
        price: user ? optionPriceForUser(option, user, product.category) : null,
        orderQuantity: "",
        importItem: catalogOrderItemToken(product, option),
        quantityStep: quantityStepForWeight(option.weightGrams),
        productUrl: product.productUrl || "",
      };
    });
  });
}

const columnName = (index) => {
  let value = index;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
};

const wrappedLineCount = (value, columnWidth) => {
  const text = String(value || "").trim();
  if (!text) return 1;
  const charactersPerLine = Math.max(8, Math.floor(columnWidth * 1.15));
  return text.split(/\r?\n/).reduce((total, paragraph) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) return total + 1;
    let lines = 1;
    let currentLength = 0;
    words.forEach((word) => {
      const nextLength = currentLength ? currentLength + word.length + 1 : word.length;
      if (currentLength && nextLength > charactersPerLine) {
        lines += 1;
        currentLength = word.length;
      } else {
        currentLength = nextLength;
      }
    });
    return total + lines;
  }, 0);
};

const catalogRowHeight = (item, columns) => {
  return Math.max(24, ...columns.filter((column) => !column.hidden).map((column) => wrappedLineCount(item[column.key], column.width) * 13 + 8));
};

const formatCatalogSheet = (
  sheet,
  columns,
  rows,
  filterLabel,
  accentColor = DEFAULT_ETHNICITY_COLOR,
  generatedAtLabel = clientGenerationContext().label,
  orderEnabled = false,
  sections = null
) => {
  const lastColumn = columnName(columns.length);
  const headerRowNumber = 6;
  const firstDataRow = headerRowNumber + 1;
  const sectionRowCount = sections?.length || 0;
  const lastDataRow = Math.max(
    firstDataRow,
    firstDataRow + rows.length + sectionRowCount - 1
  );
  const accentArgb = excelArgb(accentColor);
  const accentTextArgb = excelArgb(buttonTextColor(accentColor));
  const accentBorderArgb = excelArgb(mixWithWhite(accentColor, 0.55));

  sheet.columns = columns.map(({ key, width }) => ({ key, width }));
  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell("A1").value = "SACRED CONNECTION WHOLESALE";
  sheet.getCell("A1").font = {
    bold: true,
    size: 14,
    color: { argb: accentTextArgb },
  };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: accentArgb },
  };
  sheet.getCell("A1").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  sheet.getRow(1).height = 30;

  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getCell("A2").value = filterLabel || "Complete catalog";
  sheet.getCell("A2").font = { italic: true, color: { argb: "FF4F625D" } };
  sheet.getCell("A2").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  sheet.getRow(2).height = 24;

  sheet.getCell("A3").value = "Catalog products";
  sheet.getCell("B3").value = new Set(rows.map((row) => row.productId)).size;
  sheet.getCell("D3").value = "Products / variations";
  sheet.getCell("E3").value = rows.length;
  ["A3", "D3"].forEach((address) => {
    sheet.getCell(address).font = { bold: true, color: { argb: accentArgb } };
  });
  sheet.getRow(3).eachCell({ includeEmpty: true }, (cell) => {
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  sheet.mergeCells(`A4:${lastColumn}4`);
  sheet.getCell("A4").value = `Generated in client local time: ${generatedAtLabel}`;
  sheet.getCell("A4").font = {
    italic: true,
    size: 10,
    color: { argb: "FF4F625D" },
  };
  sheet.getCell("A4").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  sheet.getRow(4).height = 24;

  const visibleColumnCount = columns.filter((column) => !column.hidden).length;
  const visibleLastColumn = columnName(visibleColumnCount);
  sheet.mergeCells(`A5:${visibleLastColumn}5`);
  sheet.getCell("A5").value = orderEnabled
    ? "ORDER: enter a quantity only in the yellow column. Leave unwanted items blank or enter 0, then import this .xlsx file on the website."
    : "READ-ONLY CATALOG: sign in on the website to download the editable order workbook with client pricing.";
  sheet.getCell("A5").font = { bold: true, color: { argb: "FF664700" } };
  sheet.getCell("A5").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFE699" },
  };
  sheet.getCell("A5").alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  sheet.getRow(5).height = 36;

  sheet.getRow(headerRowNumber).values = columns.map(({ header }) => header);
  sheet.getRow(headerRowNumber).height = 42;
  sheet.getRow(headerRowNumber).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: accentTextArgb } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: accentArgb },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      bottom: { style: "medium", color: { argb: accentBorderArgb } },
    };
  });

  const keyIndex = new Map(columns.map((column, index) => [column.key, index + 1]));
  const rowNumbers = new Map();
  const sectionRowNumbers = new Set();
  if (sections?.length) {
    let cursor = firstDataRow;
    sections.forEach((section) => {
      sectionRowNumbers.add(cursor);
      sheet.mergeCells(`A${cursor}:${lastColumn}${cursor}`);
      const sectionCell = sheet.getCell(`A${cursor}`);
      sectionCell.value = section.ethnicity;
      sectionCell.font = {
        bold: true,
        size: 11,
        color: { argb: excelArgb(buttonTextColor(section.accentColor)) },
      };
      sectionCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: excelArgb(section.accentColor) },
      };
      sectionCell.alignment = { horizontal: "left", vertical: "middle" };
      sheet.getRow(cursor).height = 24;
      cursor += 1;
      section.rows.forEach((item) => {
        rowNumbers.set(item, cursor);
        cursor += 1;
      });
    });
  }
  rows.forEach((item, index) => {
    const row = sheet.getRow(rowNumbers.get(item) || firstDataRow + index);
    row.values = columns.map(({ key }) => item[key] ?? "");
    row.height = catalogRowHeight(item, columns);
    columns.forEach(({ key }, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    });

    if (keyIndex.has("price")) {
      row.getCell(keyIndex.get("price")).numFmt = '"$"#,##0.00';
    }
    if (keyIndex.has("availability")) {
      const availabilityCell = row.getCell(keyIndex.get("availability"));
      availabilityCell.font = {
        bold: true,
        color: { argb: item.inStock ? "FF1F6B5D" : "FF9D1C1C" },
      };
      if (!item.inStock) {
        availabilityCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFE4E1" },
        };
      }
    }
    if (keyIndex.has("orderQuantity")) {
      const quantityCell = row.getCell(keyIndex.get("orderQuantity"));
      const step = Math.max(1, Number(item.quantityStep) || 1);
      const stockLimit = Math.min(MAX_ORDER_ITEM_QUANTITY, item.maximumQuantity ?? MAX_ORDER_ITEM_QUANTITY);
      const address = quantityCell.address;
      quantityCell.numFmt = "0";
      quantityCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: item.inStock ? "FFFFE699" : "FFFFE4B5" },
      };
      quantityCell.protection = { locked: false };
      quantityCell.dataValidation = {
        type: "custom",
        allowBlank: true,
        formulae: [
          `OR(${address}="",${address}=0,AND(ISNUMBER(${address}),${address}=INT(${address}),${address}>=${step},${address}<=${stockLimit},MOD(${address},${step})=0))`,
        ],
        showErrorMessage: true,
        errorStyle: "stop",
        errorTitle: "Invalid order quantity",
        error: `Use a whole number from ${step} to ${stockLimit} in multiples of ${step}, or leave the cell blank.`,
        showInputMessage: true,
        promptTitle: "Order quantity",
        prompt:
          step === 1
            ? `Enter a whole-number quantity up to ${stockLimit}, or leave blank.`
            : `This weight must be ordered in multiples of ${step}, up to ${stockLimit}.`,
      };
    }
    if (keyIndex.has("productUrl") && item.productUrl) {
      row.getCell(keyIndex.get("productUrl")).value = {
        text: "Open product",
        hyperlink: new URL(item.productUrl, window.location.origin).href,
      };
      row.getCell(keyIndex.get("productUrl")).font = {
        color: { argb: BRAND_GREEN },
        underline: true,
      };
    }
    const fill = index % 2 === 1 ? "FFF3F7F6" : null;
    if (fill) {
      row.eachCell((cell, columnNumber) => {
        if (columnNumber === keyIndex.get("orderQuantity")) return;
        if (columnNumber === keyIndex.get("availability") && !item.inStock) return;
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      });
    }
  });

  for (let rowNumber = 1; rowNumber <= lastDataRow; rowNumber += 1) {
    if (sectionRowNumbers.has(rowNumber)) {
      sheet.getRow(rowNumber).getCell(1).border = catalogGridBorder();
      continue;
    }
    for (let columnNumber = 1; columnNumber <= columns.length; columnNumber += 1) {
      const cell = sheet.getRow(rowNumber).getCell(columnNumber);
      const key = columns[columnNumber - 1]?.key;
      cell.border = catalogGridBorder();
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: rowNumber >= headerRowNumber,
      };
    }
  }
  sheet.getRow(headerRowNumber).eachCell((cell) => {
    cell.border = {
      ...catalogGridBorder(),
      bottom: { style: "medium", color: { argb: accentBorderArgb } },
    };
  });

  if (!sections?.length) {
    sheet.autoFilter = {
      from: `A${headerRowNumber}`,
      to: `${lastColumn}${lastDataRow}`,
    };
  }
  columns.forEach((column, index) => {
    if (column.hidden) sheet.getColumn(index + 1).hidden = true;
  });
};

export async function buildCatalogOrderWorkbook({
  products,
  user,
  filterLabel = "Complete catalog",
}) {
  if (!user) {
    throw new Error("Sign in with your wholesale account to generate an order spreadsheet.");
  }
  const includePricing = true;
  const orderEnabled = true;
  const ExcelJS = await import("exceljs");
  const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
  const workbook = new Workbook();
  workbook.creator = "Sacred Connection Wholesale";
  workbook.subject = "Wholesale digital product catalog";
  workbook.title = "Sacred Connection Wholesale Catalog";
  const generation = clientGenerationContext();
  workbook.created = generation.date;
  workbook.modified = generation.date;

  const baseColumns = [
    { key: "product", header: "Product", width: 42 },
    { key: "option", header: "Format", width: 24 },
    { key: "weight", header: "Weight (g)", width: 14 },
    { key: "availability", header: "Availability", width: 18 },
  ];
  const pricingColumns = includePricing
    ? [{ key: "price", header: "Unit Price (USD)", width: 19 }]
    : [];
  const orderColumns = orderEnabled
    ? [{ key: "orderQuantity", header: ORDER_QUANTITY_HEADER, width: 18 }]
    : [];
  // Keep the customer-facing workbook concise: it contains only order data.
  const linkColumns = [];
  const technicalColumns = orderEnabled
    ? [{ key: "importItem", header: ORDER_ITEM_HEADER, width: 2, hidden: true }]
    : [];
  const columns = [
    ...baseColumns,
    { key: "sku", header: "SKU", width: 24 },
    ...pricingColumns,
    ...orderColumns,
    ...linkColumns,
    ...technicalColumns,
  ];
  const protectionPassword =
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  const groups = groupCatalogProducts(products || []);
  const sheetNames = new Set();
  for (const group of groups) {
    const sections = group.subcategories.map((subcategory) => ({
      ethnicity: subcategory.name || group.name,
      accentColor: ethnicityColor({ tribe: subcategory.name }),
      rows: catalogRows(subcategory.products, user),
    })).filter((section) => section.rows.length);
    if (!sections.length) continue;
    const baseName = group.name.replace(/[\\/*?:\[\]]/g, " ").replace(/^'+|'+$/g, "").trim().slice(0, 31) || "Wholesale Order";
    let sheetName = baseName;
    for (let suffix = 2; sheetNames.has(sheetName.toLowerCase()); suffix += 1) {
      sheetName = `${baseName.slice(0, 27)} ${suffix}`;
    }
    sheetNames.add(sheetName.toLowerCase());
    const sheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: excelArgb(DEFAULT_ETHNICITY_COLOR) } },
      views: [{ state: "frozen", ySplit: 6, showGridLines: false }],
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, printTitlesRow: "1:6" },
    });
    formatCatalogSheet(
      sheet, columns, sections.flatMap((section) => section.rows),
      `${group.name} | ${filterLabel}`, DEFAULT_ETHNICITY_COLOR,
      generation.label, orderEnabled, sections
    );
    await sheet.protect(protectionPassword, {
      spinCount: 10_000, selectLockedCells: true, selectUnlockedCells: orderEnabled,
      formatCells: false, formatColumns: false, formatRows: false,
      insertColumns: false, insertRows: false, deleteColumns: false, deleteRows: false,
      sort: false, autoFilter: true,
    });
  }
  if (!sheetNames.size) throw new Error("No available product formats match this export.");

  if (orderEnabled) {
    const metadata = workbook.addWorksheet(ORDER_WORKBOOK_META_SHEET, {
      state: "veryHidden",
    });
    metadata.getCell("A1").value = "Marker";
    metadata.getCell("B1").value = ORDER_WORKBOOK_MARKER;
    metadata.getCell("A2").value = "Version";
    metadata.getCell("B2").value = ORDER_WORKBOOK_VERSION;
    metadata.getCell("A3").value = "Generated";
    metadata.getCell("B3").value = generation.label;
    await metadata.protect(protectionPassword, {
      spinCount: 10_000,
      selectLockedCells: false,
      selectUnlockedCells: false,
    });
  }

  return workbook;
}

export async function exportCatalogExcel(options) {
  const workbook = await buildCatalogOrderWorkbook(options);
  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `sacred-connection-order-${safeFilenameDate(workbook.created)}.xlsx`
  );
}

export {
  loadPdfCatalog,
  generateCatalogPdf,
  saveCatalogPdf,
  createDigitalCatalogPdfPreview,
  downloadDigitalCatalogPdf,
} from "@/lib/catalog-pdf-export";
