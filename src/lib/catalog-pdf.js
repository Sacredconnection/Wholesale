// Pure PDF layout: callers supply normalized products and optional image data.
// Keeping browser I/O outside this module also makes pagination testable.
export function pdfText(value) {
  return String(value ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[^\u0020-\u00ff\n]/g, " ");
}

export function renderCatalogListPdf({
  jsPDF,
  groups,
  images = new Map(),
  generatedAt = new Date(),
  generatedAtLabel,
  filterLabel = "Selected catalog",
  includePrices = true,
  onProductRendered,
}) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  pdf.setProperties({
    title: "Sacred Connection Wholesale Catalog",
    subject: "Selected wholesale products and available formats",
    author: "Sacred Connection",
  });
  pdf.setCreationDate(generatedAt);
  const margin = 14;
  const width = 182;
  const bottom = 274;
  const green = [20, 65, 57];
  let cursor = 0;
  let context = "";
  let rendered = 0;

  const text = (value, x, y, options) => pdf.text(pdfText(value), x, y, options);
  const lines = (value, availableWidth) => pdf.splitTextToSize(pdfText(value), availableWidth);
  const font = (size, bold = false, color = [30, 44, 40]) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
  };
  const newPage = (first = false) => {
    if (!first) pdf.addPage();
    pdf.setFillColor(...green);
    pdf.rect(0, 0, 210, 27, "F");
    font(15, true, [255, 255, 255]);
    text("SACRED CONNECTION", margin, 12);
    font(8, false, [195, 225, 216]);
    text("WHOLESALE CATALOG", margin, 19);
    font(8, false);
    const contextLines = lines(context || filterLabel, width);
    text(contextLines, margin, 33);
    cursor = 36 + Math.max(0, contextLines.length - 1) * 3.3;
    if (first) {
      font(7.5, false, [79, 98, 91]);
      const note = includePrices
        ? "USD unit prices for your wholesale profile. Shipping is calculated at checkout."
        : "Available wholesale products and formats. Sign in to view your account prices.";
      const noteLines = lines(note, width);
      text(noteLines, margin, cursor + 2);
      cursor += noteLines.length * 3.3 + 7;
    }
  };
  const ensureRoom = (height) => {
    if (cursor + height > bottom) newPage();
  };
  const groupHeading = (category, subcategory) => {
    context = subcategory && subcategory !== category ? `${category} / ${subcategory}` : category;
    ensureRoom(60);
    pdf.setFillColor(227, 239, 234);
    pdf.rect(margin, cursor, width, 9, "F");
    font(11, true, green);
    const headingLines = lines(context, width - 6);
    const height = Math.max(9, headingLines.length * 4.3 + 4);
    if (height > 9) pdf.rect(margin, cursor, width, height, "F");
    text(headingLines, margin + 3, cursor + 6);
    cursor += height + 3;
  };
  const productHeading = (product, continued = false) => {
    font(10.5, true);
    const title = `${product.title || product.name}${continued ? " (continued)" : ""}`;
    const titleLines = lines(title, continued ? width - 4 : width - 32);
    font(7);
    const skuLines = lines(`Product SKU: ${product.sku || "-"}`, continued ? width - 4 : width - 32);
    const height = Math.max(continued ? 16 : 29, titleLines.length * 4.2 + skuLines.length * 3 + 9);
    ensureRoom(height + 17);
    const titleX = continued ? margin + 2 : margin + 30;
    font(10.5, true);
    text(titleLines, titleX, cursor + 5);
    font(7, false, [80, 97, 91]);
    text(skuLines, titleX, cursor + 8 + titleLines.length * 4.2);
    if (!continued) {
      const image = images.get(product.id);
      if (image) {
        try {
          pdf.addImage(image.dataUrl, image.format || "PNG", margin + 1, cursor + 1, 24, 24, undefined, "FAST");
        } catch {
          // An invalid image never removes the product, its identity or prices.
        }
      } else {
        pdf.setFillColor(241, 245, 243);
        pdf.rect(margin + 1, cursor + 1, 24, 24, "F");
        font(8, true, green);
        text("SC", margin + 13, cursor + 15, { align: "center" });
      }
    }
    cursor += height;
  };
  const columns = includePrices
    ? [{ name: "Format", x: 14, width: 30 }, { name: "SKU", x: 44, width: 119 }, { name: "Unit price (USD)", x: 163, width: 33 }]
    : [{ name: "Format", x: 14, width: 36 }, { name: "SKU", x: 50, width: 146 }];
  const tableHeading = () => {
    pdf.setFillColor(...green);
    pdf.rect(margin, cursor, width, 7, "F");
    font(7.4, true, [255, 255, 255]);
    columns.forEach((column) => text(column.name, column.x + 2, cursor + 4.7));
    cursor += 7;
  };

  newPage(true);
  groups.forEach((category) => {
    category.subcategories.forEach((subcategory) => {
      if (!subcategory.products.length) return;
      groupHeading(category.name, subcategory.name);
      subcategory.products.forEach((product) => {
        productHeading(product);
        tableHeading();
        product.options.forEach((option, index) => {
          font(8);
          const values = [option.name || (option.weightGrams ? `${option.weightGrams} g` : "Single format"), option.sku || "-"];
          if (includePrices) values.push(`$${Number(option.catalogPrice || 0).toFixed(2)}`);
          const cellLines = values.map((value, i) => lines(value, columns[i].width - 4));
          const lineHeight = 3.5;
          const maxLinesPerPage = 48;
          const lineCount = Math.max(...cellLines.map((cell) => cell.length));
          // Even unusually long option labels/SKUs are split without truncation.
          for (let offset = 0; offset < lineCount; offset += maxLinesPerPage) {
            const rowLines = Math.min(maxLinesPerPage, lineCount - offset);
            const height = Math.max(8, rowLines * lineHeight + 4);
            if (cursor + height > bottom) {
              newPage();
              productHeading(product, true);
              tableHeading();
            }
            pdf.setFillColor(...(index % 2 ? [242, 247, 244] : [255, 255, 255]));
            pdf.rect(margin, cursor, width, height, "F");
            font(8);
            cellLines.forEach((cell, i) => {
              const visible = cell.slice(offset, offset + maxLinesPerPage);
              if (visible.length) text(visible, columns[i].x + 2, cursor + 4.8);
            });
            pdf.setDrawColor(219, 231, 225);
            pdf.line(margin, cursor + height, margin + width, cursor + height);
            cursor += height;
          }
        });
        cursor += 7;
        rendered += 1;
        onProductRendered?.(rendered);
      });
    });
  });
  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(207, 221, 214);
    pdf.line(margin, 280, margin + width, 280);
    font(6.5, false, [88, 109, 100]);
    text(`Generated: ${generatedAtLabel || generatedAt.toISOString()}`, margin, 284);
    text("Sacred Connection Wholesale", margin, 289);
    text(`${page} / ${pageCount}`, margin + width, 289, { align: "right" });
  }
  return pdf;
}
