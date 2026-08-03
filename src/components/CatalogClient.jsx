"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";
import WorkbookImportReviewModal from "@/components/WorkbookImportReviewModal";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import {
  ShoppingBag,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  PackageOpen,
  LoaderCircle,
  FileSpreadsheet,
  Info,
  Upload,
} from "lucide-react";

import { useProducts } from "@/components/ProductsContext";
import { getEthnicityColor } from "@/lib/ethnicity-colors";
import { downloadDigitalCatalogPdf, exportCatalogExcel } from "@/lib/catalog-export";
import { readCatalogOrderWorkbook } from "@/lib/catalog-order-workbook";
import { isValidQuantityForWeight } from "@/lib/pricing";

// Normalize string for accent-insensitive comparison
// Strips diacritics, lowercases and trims — used ONLY for comparison, never for display
const normalizeStr = (str) =>
  (str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const items = [1];
  const rangeStart = Math.max(2, Math.min(currentPage - 2, totalPages - 5));
  const rangeEnd = Math.min(totalPages - 1, Math.max(currentPage + 2, 6));

  if (rangeStart > 2) items.push("ellipsis-start");
  for (let page = rangeStart; page <= rangeEnd; page += 1) items.push(page);
  if (rangeEnd < totalPages - 1) items.push("ellipsis-end");
  items.push(totalPages);
  return items;
};
export default function CatalogClient({ initialProducts = [] }) {
  const {
    products: liveProducts,
    loading: liveProductsLoading,
    error: productsError,
    warning: productsWarning,
    reload,
  } = useProducts();
  const { isLoggedIn, user } = useAuth();
  const products = liveProducts.length > 0 ? liveProducts : initialProducts;
  const productsLoading = liveProductsLoading && products.length === 0;
  const canUseOrderWorkbook =
    isLoggedIn && products.some((product) => product.pricingVisible === true);
  const { cart, addSelectionsToCart, replaceCartWithSelections, setIsCartOpen, cartTotalItems } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfExportError, setPdfExportError] = useState("");
  const [workbookAction, setWorkbookAction] = useState("");
  const [workbookError, setWorkbookError] = useState("");
  const [workbookSuccess, setWorkbookSuccess] = useState("");
  const [workbookReview, setWorkbookReview] = useState(null);
  const [openWorkbookHint, setOpenWorkbookHint] = useState("");
  const importInputRef = useRef(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tribe, setTribe] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Read URL query parameters to set initial tribe filter and page
  // Resolve accent-insensitively against actual data so URL params always match
  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const tribeParam = params.get("tribe");
      if (tribeParam) {
        const match = products.find(
          (p) => normalizeStr(p.tribe) === normalizeStr(tribeParam)
        );
        setCategory(match?.category || "All");
        setTribe(match?.tribe || "All");
      }
      const pageParam = params.get("page");
      if (pageParam) {
        const pageNum = parseInt(pageParam);
        if (!isNaN(pageNum) && pageNum > 0) {
          setCurrentPage(pageNum);
        }
      }
    }, 0);

    return () => window.clearTimeout(syncTimer);
    // Re-resolve the tribe param when the live catalog swaps in, so URL
    // filters keep matching against the current dataset.
  }, [products]);

  // Smooth scroll ref
  const productListRef = useRef(null);
  const isMounted = useRef(false);

  // Smooth scroll effect on page change & URL query sync
  useEffect(() => {
    if (isMounted.current) {
      if (productListRef.current) {
        productListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      const params = new URLSearchParams(window.location.search);
      if (currentPage > 1) {
        params.set("page", currentPage.toString());
      } else {
        params.delete("page");
      }
      if (tribe !== "All") {
        params.set("tribe", tribe.toLowerCase());
      } else {
        params.delete("tribe");
      }
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    } else {
      isMounted.current = true;
    }
  }, [currentPage, tribe]);

  // Extract Categories and Tribes dynamically for dropdowns (A–Z, accent-insensitive dedup)
  const categories = useMemo(() => {
    const seen = new Map(); // normalised key → original string
    products.forEach((p) => {
      const key = normalizeStr(p.category);
      if (key && !seen.has(key)) seen.set(key, p.category);
    });
    const unique = [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
    return ["All", ...unique];
  }, [products]);

  const tribes = useMemo(() => {
    if (category === "All") return [];

    const normalizedCategory = normalizeStr(category);
    const seen = new Map();
    products
      .filter((p) => normalizeStr(p.category) === normalizedCategory)
      .forEach((p) => {
        const key = normalizeStr(p.tribe);
        if (key && key !== normalizedCategory && !seen.has(key)) {
          seen.set(key, p.tribe);
        }
      });
    return [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
  }, [products, category]);

  // Filtered Products – accent-insensitive matching, sorted A–Z
  const filteredProducts = useMemo(() => {
    const normCat     = normalizeStr(category);
    const normTribe   = normalizeStr(tribe);
    const normSearch  = normalizeStr(search);

    return products
      .filter((product) => {
        const matchesCategory =
          category === "All" || normalizeStr(product.category) === normCat;
        const matchesTribe =
          tribe === "All" || normalizeStr(product.tribe) === normTribe;
        const matchesSearch =
          !normSearch ||
          normalizeStr(product.name).includes(normSearch) ||
          normalizeStr(product.sku).includes(normSearch);
        return matchesCategory && matchesTribe && matchesSearch;
      })
      .sort((a, b) => normalizeStr(a.name).localeCompare(normalizeStr(b.name)));
  }, [products, category, tribe, search]);


  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredProducts, currentPage]);

  const totalPages =
    Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const mobilePageNumbers = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const firstVisiblePage = Math.min(
      Math.max(currentPage - 1, 1),
      totalPages - 2
    );

    return [firstVisiblePage, firstVisiblePage + 1, firstVisiblePage + 2];
  }, [currentPage, totalPages]);

  const desktopPageItems = useMemo(
    () => getPaginationItems(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setTribe("All");
    setCurrentPage(1);
  };

  const handlePublicCatalogPdf = async () => {
    if (pdfExporting) return;
    setPdfExporting(true);
    setPdfExportError("");

    try {
      await downloadDigitalCatalogPdf();
    } catch (exportFailure) {
      setPdfExportError(
        exportFailure.message || "The PDF catalog could not be generated."
      );
    } finally {
      setPdfExporting(false);
    }
  };

  const loadOrderWorkbookProducts = async ({ applyFilters = true } = {}) => {
    const params = new URLSearchParams({
      export: "true",
      orderWorkbook: "true",
      fresh: String(Date.now()),
    });
    if (applyFilters && search.trim()) params.set("q", search.trim());
    if (applyFilters && category !== "All") params.set("category", category);
    if (applyFilters && tribe !== "All") params.set("tribe", tribe);

    const response = await fetch(`/api/catalog?${params.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data.error || "The order spreadsheet could not be prepared."
      );
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
      throw new Error("There are no products matching the current filters.");
    }
    return data.products;
  };

  const orderWorkbookFilterLabel = () => {
    const labels = [];
    if (search.trim()) labels.push(`Search: ${search.trim()}`);
    if (category !== "All") labels.push(`Category: ${category}`);
    if (tribe !== "All") labels.push(`Collection: ${tribe}`);
    return labels.length ? labels.join(" | ") : "Complete catalog";
  };

  const handleWorkbookExport = async () => {
    if (!canUseOrderWorkbook || workbookAction) return;
    setWorkbookAction("export");
    setWorkbookError("");
    setWorkbookSuccess("");
    try {
      const exportProducts = await loadOrderWorkbookProducts();
      await exportCatalogExcel({
        products: exportProducts,
        user,
        filterLabel: orderWorkbookFilterLabel(),
      });
    } catch (error) {
      setWorkbookError(error.message || "The order spreadsheet could not be generated.");
    } finally {
      setWorkbookAction("");
    }
  };

  const openWorkbookImport = () => {
    setWorkbookError("");
    setWorkbookSuccess("");
    if (canUseOrderWorkbook) importInputRef.current?.click();
  };

  const handleWorkbookImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith(".xlsx")) {
      setWorkbookError("Choose the .xlsx workbook generated from this catalog.");
      return;
    }

    setWorkbookAction("import");
    setWorkbookError("");
    setWorkbookSuccess("");
    try {
      const importedItems = await readCatalogOrderWorkbook(file);
      const liveProducts = await loadOrderWorkbookProducts({
        applyFilters: false,
      });
      const liveOptions = new Map();
      liveProducts.forEach((product) => {
        (product.options || []).forEach((option, optionIndex) => {
          const storeId = String(product.storeId || "sacred-connection");
          const sku = String(option.sku || "").trim();
          if (!sku) return;
          liveOptions.set(`${storeId}\u0000${sku.toLocaleLowerCase()}`, {
            product,
            optionIndex,
            option,
          });
        });
      });

      const errors = [];
      const selections = importedItems.flatMap((item) => {
        const match = liveOptions.get(
          `${item.storeId}\u0000${item.sku.toLocaleLowerCase()}`
        );
        if (!match) {
          errors.push(`${item.source}: product is no longer available.`);
          return [];
        }
        if (match.option.inStock === false) {
          errors.push(`${item.source}: this product is currently out of stock.`);
          return [];
        }
        const currentStock = Number(match.option.stockQuantity);
        if (
          match.option.backordersAllowed !== true &&
          Number.isFinite(currentStock) &&
          currentStock >= 0 &&
          item.quantity > currentStock
        ) {
          errors.push(`${item.source}: only ${currentStock} unit(s) are currently available.`);
          return [];
        }
        if (!isValidQuantityForWeight(item.quantity, match.option.weightGrams)) {
          errors.push(`${item.source}: quantity is not valid for ${match.product.name} (${match.option.name}).`);
          return [];
        }
        return [{
          product: match.product,
          optionIndex: match.optionIndex,
          quantity: item.quantity,
        }];
      });
      if (errors.length) {
        throw new Error(`${errors.slice(0, 4).join(" ")}${errors.length > 4 ? ` ${errors.length - 4} more error(s).` : ""}`);
      }
      setWorkbookReview(selections);
    } catch (error) {
      setWorkbookError(error.message || "The order spreadsheet could not be imported.");
    } finally {
      setWorkbookAction("");
    }
  };

  const confirmWorkbookImport = (selections, importMode) => {
    const importedCount = importMode === "add"
      ? addSelectionsToCart(selections)
      : replaceCartWithSelections(selections);
    if (importedCount !== selections.length) {
      setWorkbookError("The reviewed order could not be added to the order sheet.");
      setWorkbookReview(null);
      return;
    }
    setWorkbookReview(null);
    setWorkbookSuccess(
      `${importedCount} ${importedCount === 1 ? "product line was" : "product lines were"} ${importMode === "add" ? "added to" : "loaded into"} your order sheet.`
    );
    setIsCartOpen(true);
  };

  return (
    <div id="top" className="site-background-page bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {workbookReview && (
        <WorkbookImportReviewModal
          selections={workbookReview}
          user={user}
          existingCart={cart}
          replacesExistingOrder={cart.length > 0}
          onClose={() => setWorkbookReview(null)}
          onConfirm={confirmWorkbookImport}
        />
      )}

      {pdfExporting && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#102c27]/95 px-5 backdrop-blur-sm xl:hidden"
          role="status"
          aria-live="assertive"
          aria-label="Generating your PDF catalog. Please wait and keep this page open."
        >
          <div className="w-full max-w-xl rounded-xl border border-[#82d6c5]/45 bg-[#183b35] px-6 py-10 text-center shadow-2xl shadow-black/50 sm:px-10 sm:py-14">
            <LoaderCircle
              className="mx-auto h-14 w-14 animate-spin text-[#82d6c5] sm:h-16 sm:w-16"
              aria-hidden="true"
            />
            <p className="mt-7 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Generating your PDF catalog...
            </p>
            <p className="mx-auto mt-4 max-w-md text-base font-semibold leading-7 text-white/75 sm:text-lg">
              This may take a moment. Please wait and keep this page open until the PDF is ready.
            </p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col gap-10 sm:gap-12">
        {/* Page Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 sm:pb-8 gap-4 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#268072]/15 border border-[#268072]/30 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-[#82d6c5] uppercase font-label-sm mb-3">
              B2B Portal
            </div>
            <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">
              Wholesale Product Catalog
            </h1>
            <p className="font-body-md text-base text-white/60 max-w-2xl mt-2 leading-relaxed">
              Explore our current wholesale assortment. Approved partners can sign in to view their pricing and build an order.
            </p>
          </div>
          {/* Header Action Buttons */}
          <div className="flex w-full shrink-0 flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
            {/* Download Catalog PDF Button */}
            <button
              onClick={handlePublicCatalogPdf}
              disabled={pdfExporting}
              className="flex w-full grow items-center justify-center gap-3 rounded-sm border-0 bg-[#EC2300] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#EC2300]/15 transition-all duration-300 hover:bg-[#c51d00] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:grow-0"
            >
              {pdfExporting ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-white" aria-hidden="true" />
              ) : (
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              )}
              {pdfExporting ? "Generating PDF" : "PDF Catalog"}
            </button>

            {canUseOrderWorkbook ? (
              <>
                <div className="group relative w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleWorkbookExport}
                    disabled={Boolean(workbookAction)}
                    aria-describedby="export-order-excel-tooltip"
                    className="flex w-full grow items-center justify-center gap-3 rounded-sm border border-white/10 bg-white/5 py-3.5 pl-6 pr-14 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:border-[#268072]/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#82d6c5] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:grow-0 sm:px-6"
                  >
                    {workbookAction === "export" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin text-[#82d6c5]" aria-hidden="true" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
                    )}
                    {workbookAction === "export" ? "Preparing Excel" : "Export Order Excel"}
                  </button>
                  <button
                    type="button"
                    aria-label="About exporting an Excel order"
                    aria-expanded={openWorkbookHint === "export"}
                    aria-controls="export-order-excel-tooltip"
                    onClick={() => setOpenWorkbookHint((current) => current === "export" ? "" : "export")}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/15 text-[#82d6c5] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#82d6c5] sm:hidden"
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span
                    id="export-order-excel-tooltip"
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-sm border border-white/15 bg-[#161616] px-3 py-2 text-center font-body-md text-xs normal-case leading-relaxed tracking-normal text-white/85 shadow-xl transition-opacity duration-150 motion-reduce:transition-none sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${openWorkbookHint === "export" ? "opacity-100" : "opacity-0"}`}
                  >
                    Download an Excel order form with current products and your pricing. Enter quantities, then import it here.
                  </span>
                </div>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleWorkbookImport}
                  className="sr-only"
                  tabIndex={-1}
                />
                <div className="group relative w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={openWorkbookImport}
                    disabled={Boolean(workbookAction)}
                    aria-describedby="import-order-excel-tooltip"
                    className="flex w-full grow items-center justify-center gap-3 rounded-sm border border-[#82d6c5]/40 bg-[#268072]/20 py-3.5 pl-6 pr-14 text-sm font-bold uppercase tracking-wide text-[#82d6c5] transition-all duration-300 hover:bg-[#268072]/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#82d6c5] disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:grow-0 sm:px-6"
                  >
                    {workbookAction === "import" ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden="true" />
                    )}
                    {workbookAction === "import" ? "Validating Excel" : "Import Order Excel"}
                  </button>
                  <button
                    type="button"
                    aria-label="About importing an Excel order"
                    aria-expanded={openWorkbookHint === "import"}
                    aria-controls="import-order-excel-tooltip"
                    onClick={() => setOpenWorkbookHint((current) => current === "import" ? "" : "import")}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#82d6c5]/25 bg-black/10 text-[#82d6c5] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#82d6c5] sm:hidden"
                  >
                    <Info className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span
                    id="import-order-excel-tooltip"
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[min(18rem,calc(100vw-2rem))] -translate-x-1/2 rounded-sm border border-white/15 bg-[#161616] px-3 py-2 text-center font-body-md text-xs normal-case leading-relaxed tracking-normal text-white/85 shadow-xl transition-opacity duration-150 motion-reduce:transition-none sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 ${openWorkbookHint === "import" ? "opacity-100" : "opacity-0"}`}
                  >
                    Upload your completed order form to validate quantities and load them into your order sheet.
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="relative flex w-full grow items-center justify-center gap-3 rounded-sm border border-white/10 bg-[#1a1a1a] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:border-white/20 hover:bg-white/5 sm:w-auto sm:grow-0"
                >
                  <ShoppingBag className="w-4 h-4 text-[#82d6c5]" />
                  Order Sheet
                  {cartTotalItems > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-[#e02401] text-[10px] font-bold text-white">
                      {cartTotalItems}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="flex w-full items-center justify-center rounded-sm border border-[#82d6c5]/40 bg-[#268072]/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#82d6c5] transition-colors hover:bg-[#268072]/25 hover:text-white sm:w-auto"
              >
                Client login
              </button>
            )}
          </div>
        </div>

        {pdfExportError && (
          <div
            className="rounded-sm border border-red-300/25 bg-red-950/45 px-4 py-3 text-sm font-semibold text-red-100"
            role="alert"
          >
            {pdfExportError}
          </div>
        )}

        {workbookError && (
          <div
            className="rounded-sm border border-red-300/25 bg-red-950/45 px-4 py-3 text-sm font-semibold text-red-100"
            role="alert"
          >
            {workbookError}
          </div>
        )}

        {workbookSuccess && (
          <div
            className="rounded-sm border border-[#82d6c5]/30 bg-[#102c27]/70 px-4 py-3 text-sm font-semibold text-[#82d6c5]"
            role="status"
          >
            {workbookSuccess}
          </div>
        )}

        <FilterSidebar
          filters={{ search, category, tribe }}
          categories={categories.slice(1)}
          tribes={tribes}
          allValue="All"
          onChange={(nextFilters) => {
            if ("search" in nextFilters) setSearch(nextFilters.search);
            if ("category" in nextFilters) setCategory(nextFilters.category);
            if ("tribe" in nextFilters) setTribe(nextFilters.tribe);
            setCurrentPage(1);
          }}
          onClear={handleClearFilters}
          disabled={productsLoading}
        />

        {productsWarning && (
          <div role="status" className="rounded-sm border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-xs text-yellow-200">
            {productsWarning} Products from the available store are shown below.
          </div>
        )}

        {/* Product Card Grid */}
        <div ref={productListRef} className="scroll-mt-28 overflow-hidden rounded-xl border border-white/10 bg-[#131313]/60">
          {/* Product Items */}
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 gap-4">
              <div className="w-10 h-10 border-4 border-[#268072] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
                Loading live catalog…
              </p>
            </div>
          ) : productsError && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 px-4 sm:px-6 gap-4 text-center">
              <PackageOpen className="w-16 h-16 text-white/20" />
              <p className="text-sm text-white/50 font-medium max-w-md">
                {productsError || "We could not load the wholesale catalog right now. Please try again shortly."}
              </p>
              <button
                onClick={reload}
                className="text-xs font-bold text-[#82d6c5] uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-2">
              {paginatedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="catalog-product-row grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-5 rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg shadow-black/20 transition-[background-color,border-color,box-shadow] hover:border-[#268072]/50 hover:bg-[#1b1b1b] hover:shadow-xl"
                  >
                    {/* Image Column — product thumbnail, tribe-letter fallback */}
                    <div className="col-span-1 flex items-center">
                      <Link href={`/product/${product.slug}?fromPage=${currentPage}`} className="block">
                        {product.image ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-[#131313] shadow-md transition-all duration-300 hover:border-[#268072]/45 hover:shadow-lg">
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div
                            className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-white/10 text-lg font-black uppercase text-white shadow-md transition-all duration-300 hover:border-[#268072]/45 hover:shadow-lg font-mono select-none"
                            style={{ backgroundColor: getEthnicityColor(product.tribe, product.category) }}
                          >
                            <span className="transform hover:scale-110 transition-transform duration-300">
                              {product.tribe ? product.tribe.charAt(0).toUpperCase() : ""}
                            </span>
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Name Column */}
                    <div className="col-span-1 flex min-w-0 flex-col gap-2">
                      <Link href={`/product/${product.slug}?fromPage=${currentPage}`} className="hover:text-[#82d6c5] transition-colors text-left no-underline group">
                        <h3 className="catalog-product-title font-headline-md text-lg font-bold text-white group-hover:text-[#82d6c5] transition-colors flex items-center gap-2 flex-wrap">
                          {product.name}
                          {product.isNew && (
                            <span className="inline-block text-[9px] font-black tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm uppercase align-middle">
                              New
                            </span>
                          )}
                        </h3>
                      </Link>
                      <div className="flex min-w-0 flex-wrap gap-2">
                        <span className="max-w-full break-words text-[10px] font-semibold bg-[#268072]/15 text-[#82d6c5] border border-[#268072]/30 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                          {product.category}
                        </span>
                        {product.tribe && (
                          <span className="max-w-full break-words text-[10px] font-semibold bg-white/5 text-white/50 border border-white/10 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                            {product.tribe}
                          </span>
                        )}
                        <span className="max-w-full break-words text-[10px] font-semibold text-white/40 px-1 py-0.5 uppercase tracking-wide font-label-sm">
                          {product.storeName}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2 border-t border-white/10 pt-4">
                      {isLoggedIn && product.pricingVisible === true ? (
                        <ProductPurchaseControls
                          product={product}
                        />
                      ) : (
                        <div className="flex flex-col gap-3 rounded-lg border border-[#82d6c5]/20 bg-[#102c27]/55 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">
                              {isLoggedIn
                                ? "Loading your partner pricing"
                                : "Partner pricing is private"}
                            </p>
                            <p className="mt-1 text-xs text-white/55">
                              {isLoggedIn
                                ? "Your account-specific catalog is being prepared."
                                : "Sign in to see pricing for your approved account level."}
                            </p>
                          </div>
                          {!isLoggedIn && (
                          <button
                            type="button"
                            onClick={() => setIsLoginOpen(true)}
                            className="shrink-0 rounded-sm border border-[#82d6c5]/35 bg-[#268072]/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#82d6c5] transition-colors hover:bg-[#268072]/30 hover:text-white"
                          >
                            Sign in to view pricing
                          </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
              <PackageOpen className="w-16 h-16 text-white/20" />
              <p className="text-sm text-white/40 font-medium">No wholesale remedies match the current criteria.</p>
              <button
                onClick={handleClearFilters}
                className="text-xs font-bold text-[#82d6c5] uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-hidden border-t border-white/5 px-2 py-8 sm:gap-4 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                aria-label="Previous catalog page"
                className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 sm:hidden">
                {mobilePageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to catalog page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`h-10 w-10 rounded-sm border font-mono text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? "bg-[#268072] text-white border-[#268072]"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <div className="hidden max-w-full items-center justify-center gap-2 sm:flex">
                {desktopPageItems.map((item) =>
                  typeof item === "string" ? (
                    <span key={item} aria-hidden="true" className="w-6 text-center text-white/35">
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      aria-label={`Go to catalog page ${item}`}
                      aria-current={currentPage === item ? "page" : undefined}
                      className={`h-10 w-10 shrink-0 rounded-sm border font-mono text-xs font-bold transition-all cursor-pointer ${
                        currentPage === item
                          ? "bg-[#268072] text-white border-[#268072]"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                aria-label="Next catalog page"
                className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Shared Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
