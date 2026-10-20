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
  generatedAt = new Date(),
  generatedAtLabel,
  filterLabel = "Selected catalog",
  includePrices = true,
  onProductRendered,
}) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true, putOnlyUsedFonts: true });
  pdf.setProperties({
    title: "Sacred Connection Wholesale Catalog",
    subject: "Wholesale product names, prices and brief descriptions",
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
        ? "USD unit prices for your wholesale profile. Final order discounts and shipping are calculated at checkout."
        : "Wholesale products. Sign in to view your account prices.";
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
  newPage(true);
  groups.forEach((category) => {
    category.subcategories.forEach((subcategory) => {
      if (!subcategory.products.length) return;
      groupHeading(category.name, subcategory.name);
      subcategory.products.forEach((product) => {
        font(10.5, true);
        const titleLines = lines(product.title || product.name, width - 4);
        font(8);
        const description = pdfText(product.description || "Wholesale product from the Sacred Connection collection.").replace(/\s+/g, " ").trim();
        const descriptionLines = lines(description, width - 4).slice(0, 3);
        if (lines(description, width - 4).length > 3) {
          const last = descriptionLines.length - 1;
          descriptionLines[last] = descriptionLines[last].replace(/\s+\S*$/, "") + "...";
        }
        const priceLines = includePrices ? product.options.flatMap((option) =>
          lines((option.name && option.name !== "Default" ? option.name + ": " : "") + "$" + Number(option.catalogPrice || 0).toFixed(2), width - 4)
        ) : [];
        ensureRoom(titleLines.length * 4.2 + descriptionLines.length * 3.5 + 15);
        font(10.5, true);
        text(titleLines, margin + 2, cursor + 5);
        cursor += titleLines.length * 4.2 + 4;
        font(8, false, [80, 97, 91]);
        text(descriptionLines, margin + 2, cursor + 3);
        cursor += descriptionLines.length * 3.5 + 5;
        priceLines.forEach((line) => {
          ensureRoom(5);
          font(8, true, green);
          text(line, margin + 2, cursor + 3);
          cursor += 4;
        });
        pdf.setDrawColor(219, 231, 225);
        pdf.line(margin, cursor + 2, margin + width, cursor + 2);
        cursor += 8;
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
