"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  PackageOpen,
  ShoppingBag,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import ProductCard from "@/components/catalog/ProductCard";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import {
  exportCatalogExcel,
  exportCatalogPdf,
  prepareCatalogPdfDownload,
} from "@/lib/catalog-export";

const EMPTY_FILTERS = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
};

const EMPTY_PAGINATION = {
  page: 1,
  pageSize: 30,
  totalItems: 0,
  totalPages: 1,
};

function pageList(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages]);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) {
    if (page > 1 && page < totalPages) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, index) => {
    const previous = sorted[index - 1];
    return previous && page - previous > 1 ? ["ellipsis-" + page, page] : [page];
  });
}

export default function CatalogPage() {
  const { isLoggedIn, user } = useAuth();
  const { addToCart, setIsCartOpen, cartTotalItems } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 0 });
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const resultsRef = useRef(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: String(page) });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filters.category) params.set("category", filters.category);
      if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
      if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
      try {
        const response = await fetch(`/api/catalog?${params.toString()}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "The catalog could not be loaded.");
        }

        setProducts(Array.isArray(data.products) ? data.products : []);
        setCategories(data.filters?.categories || []);
        setPriceBounds(data.filters?.priceBounds || { min: 0, max: 0 });
        setPagination(data.pagination || EMPTY_PAGINATION);
        if (data.pagination?.page && data.pagination.page !== page) {
          setPage(data.pagination.page);
        }

        if (hasLoaded.current && resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        hasLoaded.current = true;
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setProducts([]);
          setError(loadError.message || "The catalog could not be loaded.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadCatalog();
    return () => controller.abort();
  }, [
    page,
    debouncedSearch,
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    isLoggedIn,
    reloadKey,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
    if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/digital-catalog?${query}` : "/digital-catalog");
  }, [debouncedSearch, filters, page]);

  const visiblePages = useMemo(
    () => pageList(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  const handleFiltersChange = (nextFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setDebouncedSearch("");
    setPage(1);
  };

  const handleAddToCart = (product, optionIndex) => {
    addToCart(product, optionIndex, 1);
    setIsCartOpen(true);
  };

  const loadExportProducts = async () => {
    const params = new URLSearchParams({ export: "true" });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.category) params.set("category", filters.category);
    if (filters.minPrice !== "") params.set("minPrice", filters.minPrice);
    if (filters.maxPrice !== "") params.set("maxPrice", filters.maxPrice);
    const response = await fetch(`/api/catalog?${params.toString()}`, {
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "The catalog could not be prepared for export.");
    }
    if (!Array.isArray(data.products) || data.products.length === 0) {
      throw new Error("There are no products matching the current filters.");
    }
    return data.products;
  };

  const filterLabel = () => {
    const labels = [];
    if (debouncedSearch) labels.push(`Search: ${debouncedSearch}`);
    if (filters.category) labels.push(`Category: ${filters.category}`);
    if (filters.minPrice !== "") labels.push(`Min: $${filters.minPrice}`);
    if (filters.maxPrice !== "") labels.push(`Max: $${filters.maxPrice}`);
    return labels.length ? labels.join(" | ") : "Complete catalog";
  };

  const handleExport = async (format) => {
    const pdfPreviewWindow = format === "pdf" ? prepareCatalogPdfDownload() : null;
    setExporting(format);
    setExportError("");
    try {
      const exportProducts = await loadExportProducts();
      if (format === "excel") {
        await exportCatalogExcel({
          products: exportProducts,
          user,
          includeLinks: isLoggedIn,
        });
      } else {
        await exportCatalogPdf({
          products: exportProducts,
          user,
          includeLinks: isLoggedIn,
          filterLabel: filterLabel(),
          previewWindow: pdfPreviewWindow,
        });
      }
    } catch (exportFailure) {
      if (pdfPreviewWindow && !pdfPreviewWindow.closed) pdfPreviewWindow.close();
      setExportError(exportFailure.message || "The export could not be generated.");
    } finally {
      setExporting("");
    }
  };

  return (
    <div id="top" className="site-background-page flex min-h-screen flex-col bg-[#23403B] text-[#e5e2e1] antialiased">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <header className="mb-9 flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex rounded-full border border-[#268072]/40 bg-[#268072]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#82d6c5]">
              Interactive digital catalog
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Wholesale Catalog
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Explore our complete collection, search by product or SKU, and refine the catalog by category, price, and availability.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:items-end">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => handleExport("pdf")}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:border-[#268072]/60 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
              >
                {exporting === "pdf" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#82d6c5]" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
                )}
                {exporting === "pdf" ? "Generating PDF" : "Generate PDF"}
              </button>
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={() => handleExport("excel")}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:border-[#268072]/60 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
              >
                {exporting === "excel" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#82d6c5]" aria-hidden="true" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
                )}
                {exporting === "excel" ? "Preparing Excel" : "Export Excel"}
              </button>
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="relative inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-[#1a1a1a] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#268072]/60"
                >
                  <ShoppingBag className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
                  Order sheet
                  {cartTotalItems > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EC2300] px-1 text-[10px] text-white">
                      {cartTotalItems}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="rounded-sm bg-[#EC2300] px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c51d00]"
                >
                  Client login
                </button>
              )}
            </div>
            {exportError && (
              <p className="max-w-lg text-right text-xs leading-5 text-[#ff9b88]" role="alert">
                {exportError}
              </p>
            )}
          </div>
        </header>

        <div className="grid items-start gap-7 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-9">
          <FilterSidebar
            filters={filters}
            categories={categories}
            priceBounds={priceBounds}
            onChange={handleFiltersChange}
            onClear={clearFilters}
            disabled={loading}
          />

          <section ref={resultsRef} aria-busy={loading} className="scroll-mt-28">
            <div className="mb-5 flex min-h-8 items-center justify-between gap-4">
              <p className="text-sm text-white/45" aria-live="polite">
                {loading
                  ? "Updating catalog..."
                  : `${pagination.totalItems} ${pagination.totalItems === 1 ? "product" : "products"}`}
              </p>
              {!isLoggedIn && (
                <p className="hidden text-xs text-white/35 sm:block">
                  Sign in to add products to an order.
                </p>
              )}
            </div>

            {error ? (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-sm border border-white/10 bg-[#1a1a1a] px-6 text-center">
                <PackageOpen className="mb-4 h-14 w-14 text-white/20" aria-hidden="true" />
                <h2 className="text-lg font-bold text-white">Catalog unavailable</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/45">{error}</p>
                <button
                  type="button"
                  onClick={() => setReloadKey((key) => key + 1)}
                  className="mt-5 rounded-sm border border-[#268072]/50 bg-[#268072]/15 px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#82d6c5]"
                >
                  Try again
                </button>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="overflow-hidden rounded-sm border border-white/10 bg-[#1a1a1a]">
                    <div className="aspect-square animate-pulse bg-white/5" />
                    <div className="space-y-3 p-5">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
                      <div className="h-6 w-4/5 animate-pulse rounded bg-white/10" />
                      <div className="h-12 animate-pulse rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      user={user}
                      isLoggedIn={isLoggedIn}
                      onAddToCart={handleAddToCart}
                      onRequireLogin={() => setIsLoginOpen(true)}
                    />
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Catalog pagination">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={pagination.page === 1}
                      aria-label="Previous page"
                      className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>

                    {visiblePages.map((item) =>
                      typeof item === "string" ? (
                        <span key={item} className="px-1 text-white/30" aria-hidden="true">...</span>
                      ) : (
                        <button
                          type="button"
                          key={item}
                          onClick={() => setPage(item)}
                          aria-current={pagination.page === item ? "page" : undefined}
                          aria-label={`Go to page ${item}`}
                          className={`h-10 min-w-10 rounded-sm border px-3 text-xs font-bold transition-colors ${
                            pagination.page === item
                              ? "border-[#268072] bg-[#268072] text-white"
                              : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.min(pagination.totalPages, current + 1))
                      }
                      disabled={pagination.page === pagination.totalPages}
                      aria-label="Next page"
                      className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-sm border border-white/10 bg-[#1a1a1a] px-6 text-center">
                <PackageOpen className="mb-4 h-14 w-14 text-white/20" aria-hidden="true" />
                <h2 className="text-lg font-bold text-white">No products found</h2>
                <p className="mt-2 text-sm text-white/45">Try adjusting or clearing the current filters.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 text-xs font-bold uppercase tracking-wider text-[#82d6c5]"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
