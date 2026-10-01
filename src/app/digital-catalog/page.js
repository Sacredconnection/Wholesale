"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  LoaderCircle,
  PackageOpen,
  RefreshCw,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import ProductCard from "@/components/catalog/ProductCard";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import {
  createDigitalCatalogPdfPreview,
  downloadDigitalCatalogPdf,
} from "@/lib/catalog-export";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

const EMPTY_FILTERS = {
  category: "",
  tribe: "",
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
  const { addToCart } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tribes, setTribes] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMeta, setPreviewMeta] = useState(null);
  const resultsRef = useRef(null);
  const hasLoaded = useRef(false);
  const previewDialogRef = useRef(null);
  const previewCloseRef = useRef(null);
  const previewButtonRef = useRef(null);

  useDialogAccessibility(isPreviewOpen, () => setIsPreviewOpen(false), {
    containerRef: previewDialogRef,
    initialFocusRef: previewCloseRef,
    returnFocusRef: previewButtonRef,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: String(page) });
      if (filters.category) params.set("category", filters.category);
      if (filters.tribe) params.set("tribe", filters.tribe);
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
        setTribes(data.filters?.tribes || []);
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
    filters.category,
    filters.tribe,
    isLoggedIn,
    reloadKey,
  ]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.tribe) params.set("tribe", filters.tribe);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    window.history.replaceState(null, "", query ? `/digital-catalog?${query}` : "/digital-catalog");
  }, [filters, page]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

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
    setPage(1);
  };

  const handleAddToCart = (product, optionIndex) => {
    addToCart(product, optionIndex, 1);
  };

  const filterLabel = () => {
    const labels = [];
    if (filters.category) labels.push(`Category: ${filters.category}`);
    if (filters.tribe) {
      labels.push(`Product Type: ${filters.tribe}`);
    }
    return labels.length ? labels.join(" | ") : "Complete catalog";
  };

  const currentPdfOptions = () => ({
    search: "",
    category: filters.category,
    tribe: filters.tribe,
    attributes: {},
    filterLabel: filterLabel(),
  });

  const handlePreviewPdf = async () => {
    setExporting("preview");
    setExportError("");
    try {
      const preview = await createDigitalCatalogPdfPreview(currentPdfOptions());
      const nextUrl = URL.createObjectURL(preview.blob);
      setPreviewUrl(nextUrl);
      setPreviewMeta({
        productCount: preview.productCount,
        generatedAt: preview.generatedAt,
        generatedAtLabel: preview.generatedAtLabel,
      });
      setIsPreviewOpen(true);
    } catch (previewFailure) {
      setExportError(
        previewFailure.message || "The PDF preview could not be generated."
      );
    } finally {
      setExporting("");
    }
  };

  return (
    <div id="top" className="site-background-page flex min-h-screen flex-col bg-[#23403B] text-[#e5e2e1] antialiased">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {(exporting === "pdf" || exporting === "preview") && (
        <div
          className={`fixed inset-0 z-[140] flex items-center justify-center bg-[#102c27]/95 px-5 backdrop-blur-sm ${
            exporting === "pdf" ? "xl:hidden" : ""
          }`}
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
              {exporting === "preview"
                ? "Updating your PDF preview..."
                : "Generating your PDF catalog..."}
            </p>
            <p className="mx-auto mt-4 max-w-md text-base font-semibold leading-7 text-white/75 sm:text-lg">
              This may take a moment. Please wait and keep this page open until the PDF is ready.
            </p>
          </div>
        </div>
      )}

      {isPreviewOpen && previewUrl && (
        <div
          className="fixed inset-0 z-[120] bg-[#081d19]/95 p-0 backdrop-blur-md sm:p-4 lg:p-6"
          aria-hidden="false"
        >
          <section
            ref={previewDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pdf-preview-title"
            tabIndex={-1}
            className="mx-auto flex h-full w-full max-w-[96rem] flex-col overflow-hidden border border-white/15 bg-[#111] shadow-2xl shadow-black/60 sm:rounded-xl"
          >
            <header className="flex flex-col gap-3 border-b border-white/10 bg-[#1a1a1a] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div className="min-w-0">
                <h2
                  id="pdf-preview-title"
                  className="truncate text-base font-black text-white sm:text-lg"
                >
                  PDF Catalog Preview
                </h2>
                <p className="mt-1 text-[11px] text-white/45 sm:text-xs">
                  {previewMeta
                    ? `${previewMeta.productCount} products · Updated ${previewMeta.generatedAtLabel}`
                    : "Current catalog preview"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                <button
                  type="button"
                  onClick={handlePreviewPdf}
                  disabled={Boolean(exporting)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-[#268072]/60 bg-[#268072]/20 px-3 text-[10px] font-black uppercase tracking-wider text-[#82d6c5] transition-colors hover:bg-[#268072]/30 disabled:cursor-wait disabled:opacity-50 sm:px-4 sm:text-xs"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${exporting === "preview" ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                  Update
                </button>
                <a
                  href={previewUrl}
                  download="sacred-connection-wholesale-catalog.pdf"
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-white/10 sm:px-4 sm:text-xs"
                >
                  <Download className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
                  Download
                </a>
                <button
                  ref={previewCloseRef}
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-white/15 bg-white/5 px-3 text-[10px] font-black uppercase tracking-wider text-white transition-colors hover:bg-white/10 sm:px-4 sm:text-xs"
                  aria-label="Close PDF preview"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Close
                </button>
              </div>
            </header>

            <div className="relative min-h-0 flex-1 bg-[#292929]">
              <iframe
                src={previewUrl}
                title="Generated wholesale catalog PDF preview"
                className="h-full w-full border-0"
              />
              <noscript>
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  Open PDF preview
                </a>
              </noscript>
            </div>
          </section>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-6 sm:py-12 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8">
          <div className="max-w-3xl">
            <span className="mb-3 inline-flex rounded-full border border-[#268072]/40 bg-[#268072]/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#82d6c5]">
              Interactive digital catalog
            </span>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Wholesale Digital Catalog
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
              Explore Sacred Connection products, then refine the catalog by category and product type or indigenous tribe.
            </p>
          </div>

          <div className="flex w-full flex-col items-stretch gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                disabled={Boolean(exporting)}
                onClick={async () => {
                  setExporting("pdf");
                  setExportError("");
                  try {
                    await downloadDigitalCatalogPdf(currentPdfOptions());
                  } catch (exportFailure) {
                    setExportError(exportFailure.message || "The PDF could not be generated.");
                  } finally {
                    setExporting("");
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-white transition-colors hover:border-[#268072]/60 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50"
              >
                {exporting === "pdf" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin text-[#82d6c5]" aria-hidden="true" />
                ) : (
                  <FileText className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
                )}
                {exporting === "pdf" ? "Generating PDF" : "Generate PDF"}
              </button>
            </div>
            {exportError && (
              <p className="max-w-lg text-right text-xs leading-5 text-[#ff9b88]" role="alert">
                {exportError}
              </p>
            )}
          </div>
        </header>

        <div className="space-y-10 sm:space-y-12">
          <FilterSidebar
            filters={filters}
            categories={categories}
            tribes={tribes}
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
              <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#1a1a1a] px-6 text-center">
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
              <div className="space-y-5">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="grid h-[41.5rem] grid-cols-1 items-stretch overflow-hidden rounded-lg border border-white/15 bg-[#1a1a1a] sm:h-[22rem] sm:grid-cols-[13.5rem_minmax(0,1fr)] lg:grid-cols-[15.5rem_minmax(0,1fr)] xl:h-[15.75rem]">
                    <div className="m-3 h-56 animate-pulse rounded-lg border border-white/10 bg-white/5 sm:h-auto xl:h-56 xl:self-start" />
                    <div className="space-y-3 p-4 sm:p-5 lg:p-6">
                      <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
                      <div className="h-6 w-4/5 animate-pulse rounded bg-white/10" />
                      <div className="h-20 animate-pulse rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="space-y-5">
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
              <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-white/10 bg-[#1a1a1a] px-6 text-center">
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
