"use client";

export const ORDER_WORKBOOK_MARKER = "SACRED_CONNECTION_ORDER_WORKBOOK";
export const ORDER_WORKBOOK_VERSION = "1";
export const ORDER_WORKBOOK_META_SHEET = "_SC_ORDER";
export const ORDER_QUANTITY_HEADER = "Order Quantity";
export const ORDER_ITEM_HEADER = "_SC_IMPORT_ITEM";

const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024;
const MAX_WORKSHEETS = 50;
const MAX_ROWS_SCANNED = 10_000;
const MAX_SELECTED_LINES = 100;
const MAX_QUANTITY = 1_000;

export const catalogOrderItemToken = (product, option) =>
  JSON.stringify({
    storeId: String(product.storeId || "sacred-connection").slice(0, 64),
    sku: String(option.sku || "").slice(0, 100),
  });

const cellScalar = (cell) => {
  const value = cell?.value;
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && "result" in value) return value.result;
  return "";
};

const normalizedHeader = (cell) => String(cellScalar(cell)).trim();

function assertWorkbookMetadata(workbook) {
  const metadata = workbook.getWorksheet(ORDER_WORKBOOK_META_SHEET);
  if (
    !metadata ||
    String(metadata.getCell("B1").value || "") !== ORDER_WORKBOOK_MARKER ||
    String(metadata.getCell("B2").value || "") !== ORDER_WORKBOOK_VERSION
  ) {
    throw new Error(
      "This is not a valid Sacred Connection order workbook. Download a new spreadsheet from the digital catalog."
    );
  }
}

function parseQuantity(cell, sheetName, rowNumber) {
  const rawValue = cellScalar(cell);
  if (rawValue === "" || rawValue == null) return 0;
  const quantity = Number(rawValue);
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 0 ||
    quantity > MAX_QUANTITY
  ) {
    throw new Error(
      `Invalid quantity in sheet "${sheetName}", row ${rowNumber}. Use a whole number from 0 to ${MAX_QUANTITY}.`
    );
  }
  return quantity;
}

function parseItemToken(cell, sheetName, rowNumber) {
  let parsed;
  try {
    parsed = JSON.parse(String(cellScalar(cell) || ""));
  } catch {
    parsed = null;
  }
  const storeId = String(parsed?.storeId || "").trim();
  const sku = String(parsed?.sku || "").trim();
  if (!storeId || !sku || storeId.length > 64 || sku.length > 100) {
    throw new Error(
      `The product reference in sheet "${sheetName}", row ${rowNumber} is invalid. Download a new spreadsheet and try again.`
    );
  }
  return { storeId, sku };
}

export async function readCatalogOrderWorkbook(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("Choose a valid Excel workbook.");
  }
  if (file.size > MAX_WORKBOOK_BYTES) {
    throw new Error("The spreadsheet is too large. The maximum file size is 10 MB.");
  }

  const ExcelJS = await import("exceljs");
  const Workbook = ExcelJS.Workbook || ExcelJS.default?.Workbook;
  const workbook = new Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error("The Excel workbook could not be read. Download a new .xlsx file and try again.");
  }

  assertWorkbookMetadata(workbook);
  const orderSheets = workbook.worksheets.filter(
    (sheet) => sheet.name !== ORDER_WORKBOOK_META_SHEET
  );
  if (orderSheets.length === 0 || orderSheets.length > MAX_WORKSHEETS) {
    throw new Error("The order workbook has an invalid number of product sheets.");
  }

  const aggregated = new Map();
  let rowsScanned = 0;
  for (const sheet of orderSheets) {
    const headerRow = sheet.getRow(6);
    let quantityColumn = 0;
    let itemColumn = 0;
    headerRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      const header = normalizedHeader(cell);
      if (header === ORDER_QUANTITY_HEADER) quantityColumn = columnNumber;
      if (header === ORDER_ITEM_HEADER) itemColumn = columnNumber;
    });
    if (!quantityColumn || !itemColumn) {
      throw new Error(
        `Sheet "${sheet.name}" is missing required order columns. Download a new spreadsheet and try again.`
      );
    }

    for (let rowNumber = 7; rowNumber <= sheet.actualRowCount; rowNumber += 1) {
      rowsScanned += 1;
      if (rowsScanned > MAX_ROWS_SCANNED) {
        throw new Error("The spreadsheet contains too many rows to import safely.");
      }
      const row = sheet.getRow(rowNumber);
      // Category divider rows have a label in the first column but no hidden
      // product reference. Ignore them before reading the quantity so stray
      // values in those rows cannot prevent the remaining products from being
      // imported.
      const isCategoryDivider =
        String(cellScalar(row.getCell(1)) || "").trim() !== "" &&
        String(cellScalar(row.getCell(itemColumn)) || "").trim() === "";
      if (isCategoryDivider) {
        continue;
      }
      const quantity = parseQuantity(
        row.getCell(quantityColumn),
        sheet.name,
        rowNumber
      );
      if (quantity === 0) continue;

      const item = parseItemToken(row.getCell(itemColumn), sheet.name, rowNumber);
      const key = `${item.storeId}\u0000${item.sku.toLocaleLowerCase()}`;
      const existing = aggregated.get(key);
      const totalQuantity = (existing?.quantity || 0) + quantity;
      if (totalQuantity > MAX_QUANTITY) {
        throw new Error(
          `The combined quantity for SKU ${item.sku} exceeds ${MAX_QUANTITY}.`
        );
      }
      aggregated.set(key, {
        ...item,
        quantity: totalQuantity,
        source: `${sheet.name}, row ${rowNumber}`,
      });
      if (aggregated.size > MAX_SELECTED_LINES) {
        throw new Error(
          `Select no more than ${MAX_SELECTED_LINES} different products or weights per order.`
        );
      }
    }
  }

  const items = [...aggregated.values()];
  if (items.length === 0) {
    throw new Error(
      `Enter a quantity in the "${ORDER_QUANTITY_HEADER}" column for at least one product before importing.`
    );
  }
  return items;
}
