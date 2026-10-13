"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { Fragment, useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import LoginModal from "@/components/LoginModal";
import CatalogPdfExportDialog from "@/components/CatalogPdfExportDialog";
import ShelfButton from "@/components/ShelfButton";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";
import WorkbookImportReviewModal from "@/components/WorkbookImportReviewModal";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import {
  ChevronLeft,
  ChevronRight,
  PackageOpen,
  LoaderCircle,
  FileSpreadsheet,
  Info,
  Upload,
  LayoutGrid,
  List,
  FileDown,
} from "lucide-react";

import { useProducts } from "@/components/ProductsContext";
import { getEthnicityColor } from "@/lib/ethnicity-colors";
import { exportCatalogExcel } from "@/lib/catalog-export";
import { readCatalogOrderWorkbook } from "@/lib/catalog-order-workbook";
import { orderQuantityError } from "@/lib/pricing";
import { catalogProductTitle, compareCatalogProducts, getCatalogTaxonomy, groupCatalogProducts } from "@/lib/catalog-taxonomy";

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

const catalogPageHref = (page, tribe, category, search) => {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (tribe !== "All") params.set("tribe", tribe.toLowerCase());
  if (category !== "All") params.set("category", category);
  if (search.trim()) params.set("q", search.trim());
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
};

export default function CatalogClient({
  initialProducts = [],
  initialPage = 1,
}) {
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
  const { cart, addSelectionsToCart, replaceCartWithSelections, setIsCartOpen } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [workbookScope, setWorkbookScope] = useState("filtered");
  const [workbookAction, setWorkbookAction] = useState("");
  const [workbookError, setWorkbookError] = useState("");
  const [workbookSuccess, setWorkbookSuccess] = useState("");
  const [workbookReview, setWorkbookReview] = useState(null);
  const [failedImages, setFailedImages] = useState({});
  const importInputRef = useRef(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tribe, setTribe] = useState("All");
  const [viewMode, setViewMode] = useState("grid");
  const [showAll, setShowAll] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(initialPage);
  const itemsPerPage = 12;

  // Read URL query parameters to set initial tribe filter and page
  // Resolve accent-insensitively against actual data so URL params always match
  useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      setSearch(params.get("q") || "");
      setShowAll(params.get("showAll") === "true");
      const categoryParam = params.get("category");
      if (categoryParam) {
        const match = products.find((product) => normalizeStr(getCatalogTaxonomy(product).mainCategory) === normalizeStr(categoryParam) || normalizeStr(product.category) === normalizeStr(categoryParam));
        setCategory(match ? getCatalogTaxonomy(match).mainCategory : "All");
      }
      const tribeParam = params.get("tribe");
      if (tribeParam) {
        const match = products.find(
          (p) => normalizeStr(getCatalogTaxonomy(p).subcategory) === normalizeStr(tribeParam)
        );
        setCategory(match ? getCatalogTaxonomy(match).mainCategory : "All");
        setTribe(match ? getCatalogTaxonomy(match).subcategory : "All");
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
  const previousPageRef = useRef(initialPage);

  // Smooth scroll effect on page change & URL query sync
  useEffect(() => {
    if (isMounted.current) {
      if (previousPageRef.current !== currentPage && productListRef.current) {
        productListRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      previousPageRef.current = currentPage;
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
      if (category !== "All") params.set("category", category);
      else params.delete("category");
      if (search.trim()) params.set("q", search.trim());
      else params.delete("q");
      if (showAll) params.set("showAll", "true");
      else params.delete("showAll");
      const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
      window.history.replaceState(null, '', newUrl);
    } else {
      isMounted.current = true;
    }
  }, [currentPage, tribe, category, search, showAll]);

  const categoryGroups = useMemo(() => groupCatalogProducts(products), [products]);
  const categories = useMemo(() => categoryGroups.map((group) => group.name), [categoryGroups]);
  const tribes = useMemo(() =>
    categoryGroups.find((group) => group.name === category)?.subcategories.map((group) => group.name) || [],
    [categoryGroups, category]
  );

  const matchesFilters = (product) => {
    const taxonomy = getCatalogTaxonomy(product);
    const term = normalizeStr(search);
    return (category === "All" || taxonomy.mainCategory === category)
      && (tribe === "All" || taxonomy.subcategory === tribe)
      && (!term || normalizeStr(product.name).includes(term)
        || normalizeStr(product.sku).includes(term)
        || product.options?.some((option) => normalizeStr(option.sku).includes(term)));
  };
  const filteredProducts = products.filter(matchesFilters).sort(compareCatalogProducts);

  // Paginated Products
  const paginatedProducts = useMemo(() => {
    if (showAll) return filteredProducts;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(
      startIndex,
      startIndex + itemsPerPage
    );
  }, [filteredProducts, currentPage, showAll]);

  const totalPages =
    showAll ? 1 : Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  useEffect(() => {
    if (productsLoading || currentPage <= totalPages) return;
    const timer = window.setTimeout(() => setCurrentPage(totalPages), 0);
    return () => window.clearTimeout(timer);
  }, [currentPage, totalPages, productsLoading]);

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
    setShowAll(false);
    setCurrentPage(1);
  };

  const loadOrderWorkbookProducts = async ({ applyFilters = true } = {}) => {
    const params = new URLSearchParams({
      export: "true",
      orderWorkbook: "true",
      fresh: String(Date.now()),
    });

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
    const result = applyFilters ? data.products.filter(matchesFilters) : data.products;
    if (!result.length) throw new Error("There are no products matching the current filters.");
    return result.sort(compareCatalogProducts);
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
      const exportProducts = await loadOrderWorkbookProducts({ applyFilters: workbookScope === "filtered" });
      await exportCatalogExcel({
        products: exportProducts,
        user,
        filterLabel: workbookScope === "filtered" ? orderWorkbookFilterLabel() : "Complete catalog",
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
        const quantityError = orderQuantityError(match.option, item.quantity);
        if (quantityError) {
          errors.push(`${item.source}: ${match.product.name} (${match.option.name}): ${quantityError}`);
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

      {isLoggedIn && user && isPdfExportOpen && (
        <CatalogPdfExportDialog key={`${user.id}:${user.role}:${user.discountRate}`} user={user} initialCategory={category} onClose={() => setIsPdfExportOpen(false)} />
      )}

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col gap-10 sm:gap-12">
        <header className="border-b border-white/10 pb-6 sm:pb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#82d6c5]">Wholesale portal</p>
          <h1 className="font-headline-lg text-3xl font-black tracking-tight text-white sm:text-4xl">Product catalog</h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-white/65">
            {isLoggedIn
              ? "Browse your account prices, choose sizes and quantities, and review your cart before ordering. You can also create a PDF catalog or prepare your order in Excel."
              : "Explore our current wholesale assortment. Approved partners can sign in to view their pricing and build an order."}
          </p>
          {isLoggedIn && <p className="mt-2 text-sm text-white/55">Save products to <Link href="/my-shelf" className="text-[#82d6c5] underline">My Shelf</Link> to find them again on your next visit.</p>}
        </header>

        <section aria-label="Catalog and order tools" className="rounded-xl border border-[#82d6c5]/20 bg-[#102c27]/60 p-4 sm:p-5">
          <h2 className="mb-3 text-sm font-bold text-white">Catalog &amp; order tools</h2>
          <div className="flex flex-wrap items-end gap-3">
            <button type="button" onClick={() => isLoggedIn ? setIsPdfExportOpen(true) : setIsLoginOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#EC2300] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#c51d00]">
              <FileDown className="h-4 w-4" aria-hidden="true" /> PDF Catalog
            </button>
            {canUseOrderWorkbook ? <>
              <label className="flex flex-col gap-1.5 text-xs text-white/60">
                Excel export includes
                <select value={workbookScope} onChange={(event) => setWorkbookScope(event.target.value)} className="min-h-12 rounded-sm border border-white/15 bg-[#131313] px-3 py-2 text-sm text-white">
                  <option value="filtered">Current filters ({filteredProducts.length} products)</option>
                  <option value="complete">Complete catalog</option>
                </select>
              </label>
              <button type="button" onClick={handleWorkbookExport} disabled={Boolean(workbookAction)} aria-describedby="excel-workflow" className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold uppercase text-white hover:bg-white/10 disabled:opacity-50">
                {workbookAction === "export" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileSpreadsheet className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />}
                {workbookAction === "export" ? "Preparing Excel" : "Export Order Excel"}
              </button>
              <button type="button" onClick={openWorkbookImport} disabled={Boolean(workbookAction)} aria-describedby="excel-workflow" className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-[#82d6c5]/40 bg-[#268072]/20 px-5 py-3 text-xs font-bold uppercase text-[#82d6c5] hover:bg-[#268072]/30 disabled:opacity-50">
                {workbookAction === "import" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
                {workbookAction === "import" ? "Validating Excel" : "Import Order Excel"}
              </button>
              <input ref={importInputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleWorkbookImport} className="sr-only" tabIndex={-1} />
            </> : !isLoggedIn && <button type="button" onClick={() => setIsLoginOpen(true)} className="min-h-12 rounded-sm border border-[#82d6c5]/40 px-5 py-3 text-xs font-bold uppercase text-[#82d6c5]">Sign in for Excel ordering</button>}
          </div>
          {canUseOrderWorkbook && <p id="excel-workflow" className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/60"><Info className="mt-0.5 h-4 w-4 shrink-0 text-[#82d6c5]" aria-hidden="true" />Export the workbook, enter quantities, then import it to review your cart. Prices and availability are checked again before you order.</p>}
        </section>

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
          categories={categories}
          categoryGroups={categoryGroups}
          tribes={tribes}
          allValue="All"
          onChange={(nextFilters) => {
            if ("search" in nextFilters) setSearch(nextFilters.search);
            if ("category" in nextFilters) setCategory(nextFilters.category);
            if ("tribe" in nextFilters) setTribe(nextFilters.tribe);
            setCurrentPage(1);
            setShowAll(false);
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
            <p className="text-sm text-white/65">{filteredProducts.length} products{tribe !== "All" ? ` in ${tribe}` : ""}</p>
            <div className="flex flex-wrap items-center gap-2">
              {filteredProducts.length > itemsPerPage && <button type="button" onClick={() => { setShowAll((value) => !value); setCurrentPage(1); }} className="rounded-sm border border-white/15 px-3 py-2 text-xs font-bold text-[#82d6c5]">{showAll ? "Show 12 per page" : `Show all ${filteredProducts.length}`}</button>}
              <button type="button" aria-label="Two-column view" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")} className={`rounded-sm border p-2 ${viewMode === "grid" ? "border-[#82d6c5] bg-[#268072]/25 text-[#82d6c5]" : "border-white/15 text-white/60"}`}><LayoutGrid className="h-4 w-4" aria-hidden="true" /></button>
              <button type="button" aria-label="Full-width list view" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")} className={`rounded-sm border p-2 ${viewMode === "list" ? "border-[#82d6c5] bg-[#268072]/25 text-[#82d6c5]" : "border-white/15 text-white/60"}`}><List className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
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
            <div className={`grid grid-cols-1 gap-4 p-3 sm:p-4 ${viewMode === "grid" ? "lg:grid-cols-2" : ""}`}>
              {paginatedProducts.map((product, index) => {
                const taxonomy = getCatalogTaxonomy(product);
                const previousTaxonomy = index > 0 ? getCatalogTaxonomy(paginatedProducts[index - 1]) : null;
                const startsGroup = taxonomy.mainCategory !== previousTaxonomy?.mainCategory || taxonomy.subcategory !== previousTaxonomy?.subcategory;
                return <Fragment key={product.id}>
                  {startsGroup && <h2 className="col-span-full border-b border-[#82d6c5]/20 pb-2 pt-3 text-sm font-bold text-[#82d6c5]">{taxonomy.mainCategory}{taxonomy.subcategory !== taxonomy.mainCategory ? ` / ${taxonomy.subcategory}` : ""}</h2>}
                  <div
                    className="catalog-product-row grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-5 rounded-xl border border-white/10 bg-[#171717] p-5 shadow-lg shadow-black/20 transition-[background-color,border-color,box-shadow] hover:border-[#268072]/50 hover:bg-[#1b1b1b] hover:shadow-xl"
                  >
                    {/* Image Column — product thumbnail, tribe-letter fallback */}
                    <div className="col-span-1 flex items-center">
                      <Link href={`/product/${product.slug}?fromPage=${currentPage}`} className="block">
                        {product.image && !failedImages[product.image] ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-white/10 bg-[#131313] shadow-md transition-all duration-300 hover:border-[#268072]/45 hover:shadow-lg">
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              onError={() => setFailedImages((current) => ({ ...current, [product.image]: true }))}
                              className="w-full h-full object-contain transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div
                            className="relative flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-white/10 text-lg font-black uppercase text-white shadow-md transition-all duration-300 hover:border-[#268072]/45 hover:shadow-lg font-mono select-none"
                            style={{ backgroundColor: getEthnicityColor(product.tribe, product.category) }}
                          >
                            <span className="transform hover:scale-110 transition-transform duration-300">
                              {(product.tribe || product.name || "P").charAt(0).toUpperCase()}
                            </span>
                            <span className="mt-1 px-1 text-center font-sans text-[8px] font-normal normal-case leading-tight text-white/70">Photo unavailable</span>
                          </div>
                        )}
                      </Link>
                    </div>

                    {/* Name Column */}
                    <div className="col-span-1 flex min-w-0 flex-col gap-2">
                      <Link href={`/product/${product.slug}?fromPage=${currentPage}`} className="hover:text-[#82d6c5] transition-colors text-left no-underline group">
                        <h3 className="catalog-product-title font-headline-md text-lg font-bold text-white group-hover:text-[#82d6c5] transition-colors flex items-center gap-2 flex-wrap">
                          {catalogProductTitle(product)}
                          {product.isNew && (
                            <span className="inline-block text-[9px] font-black tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm uppercase align-middle">
                              New
                            </span>
                          )}
                        </h3>
                      </Link>
                      <div className="flex min-w-0 flex-wrap gap-2">
                        <span className="max-w-full break-words text-[10px] font-semibold bg-[#268072]/15 text-[#82d6c5] border border-[#268072]/30 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                          {taxonomy.subcategory}
                        </span>
                        {product.availabilityLabel && <span className="text-xs text-white/55">{product.availabilityLabel}</span>}
                      </div>
                      {isLoggedIn && <ShelfButton product={product} />}
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
                </Fragment>;
              })}
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
              {currentPage === 1 ? (
                <span
                  aria-disabled="true"
                  aria-label="Previous catalog page"
                  className="cursor-not-allowed rounded-sm border border-white/10 bg-white/5 p-3 text-white opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </span>
              ) : (
                <Link
                  href={catalogPageHref(currentPage - 1, tribe, category, search)}
                  prefetch={false}
                  scroll={false}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  aria-label="Previous catalog page"
                  className="rounded-sm border border-white/10 bg-white/5 p-3 text-white transition-colors hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              )}
              <div className="flex items-center gap-2 sm:hidden">
                {mobilePageNumbers.map((page) => (
                  <Link
                    key={page}
                    href={catalogPageHref(page, tribe, category, search)}
                    prefetch={false}
                    scroll={false}
                    onClick={() => setCurrentPage(page)}
                    aria-label={`Go to catalog page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-sm border font-mono text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-[#268072] text-white border-[#268072]"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {page}
                  </Link>
                ))}
              </div>

              <div className="hidden max-w-full items-center justify-center gap-2 sm:flex">
                {desktopPageItems.map((item) =>
                  typeof item === "string" ? (
                    <span key={item} aria-hidden="true" className="w-6 text-center text-white/35">
                      &hellip;
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={catalogPageHref(item, tribe, category, search)}
                      prefetch={false}
                      scroll={false}
                      onClick={() => setCurrentPage(item)}
                      aria-label={`Go to catalog page ${item}`}
                      aria-current={currentPage === item ? "page" : undefined}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border font-mono text-xs font-bold transition-all ${
                        currentPage === item
                          ? "bg-[#268072] text-white border-[#268072]"
                          : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {item}
                    </Link>
                  )
                )}
              </div>

              {currentPage === totalPages ? (
                <span
                  aria-disabled="true"
                  aria-label="Next catalog page"
                  className="cursor-not-allowed rounded-sm border border-white/10 bg-white/5 p-3 text-white opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </span>
              ) : (
                <Link
                  href={catalogPageHref(currentPage + 1, tribe, category, search)}
                  prefetch={false}
                  scroll={false}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  aria-label="Next catalog page"
                  className="rounded-sm border border-white/10 bg-white/5 p-3 text-white transition-colors hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
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
