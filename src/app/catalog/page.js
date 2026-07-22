"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ProductOptionsModal from "@/components/ProductOptionsModal";
import AuthGate from "@/components/AuthGate";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { 
  Search, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Filter,
  PackageOpen,
  Store,
  Network,
  LoaderCircle,
} from "lucide-react";

import { useProducts } from "@/components/ProductsContext";
import { optionPriceForUser } from "@/lib/pricing";
import { getEthnicityColor } from "@/lib/ethnicity-colors";
import { exportCatalogPdf } from "@/lib/catalog-export";

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
export default function CatalogPage() {
  const { products, loading: productsLoading, error: productsError, warning: productsWarning, reload } = useProducts();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { addToCart, setIsCartOpen, cartTotalItems } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [optionsProduct, setOptionsProduct] = useState(null);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfExportError, setPdfExportError] = useState("");

  // Inline Option and Quantity States
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantities, setQuantities] = useState({});

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
    const normSearch  = normalizeStr(search);
    const normCat     = normalizeStr(category);
    const normTribe   = normalizeStr(tribe);

    return products
      .filter((product) => {
        const matchesSearch =
          normalizeStr(product.name).includes(normSearch) ||
          normalizeStr(product.sku).includes(normSearch);
        const matchesCategory =
          category === "All" || normalizeStr(product.category) === normCat;
        const matchesTribe =
          tribe === "All" || normalizeStr(product.tribe) === normTribe;
        return matchesSearch && matchesCategory && matchesTribe;
      })
      .sort((a, b) => normalizeStr(a.name).localeCompare(normalizeStr(b.name)));
  }, [products, search, category, tribe]);


  // Paginated Products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

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
      const response = await fetch("/api/catalog?export=true", {
        cache: "no-store",
        credentials: "omit",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "The public catalog could not be prepared for export.");
      }
      if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error("There are no public products available for the PDF catalog.");
      }

      await exportCatalogPdf({
        products: data.products,
        user: null,
        includeLinks: false,
        filterLabel: "Complete catalog",
      });
    } catch (exportFailure) {
      setPdfExportError(
        exportFailure.message || "The PDF catalog could not be generated."
      );
    } finally {
      setPdfExporting(false);
    }
  };

  // Catalog is partner-only: block until authenticated
  if (authLoading || !isLoggedIn) {
    return <AuthGate loading={authLoading} />;
  }

  return (
    <div id="top" className="site-background-page bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header 
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {pdfExporting && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#102c27]/95 px-5 backdrop-blur-sm xl:hidden"
          role="status"
          aria-live="assertive"
          aria-label="Generating your PDF catalog. Please wait and keep this page open."
        >
          <div className="w-full max-w-xl rounded-md border border-[#82d6c5]/45 bg-[#183b35] px-6 py-10 text-center shadow-2xl shadow-black/50 sm:px-10 sm:py-14">
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
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 flex flex-col gap-8 sm:gap-10 lg:gap-12">
        
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
              Verify pricing options and add products to your bulk order draft. Submitting the request drafts an order sheet for our verification team.
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

            {/* Quick Cart Summary Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative flex w-full grow items-center justify-center gap-3 rounded-sm border border-white/10 bg-[#1a1a1a] px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition-all duration-300 hover:border-white/20 hover:bg-white/5 sm:w-auto sm:grow-0"
            >
              <ShoppingBag className="w-4 h-4 text-[#82d6c5]" />
              Order Sheet
              {cartTotalItems > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e02401] text-[10px] font-bold text-white absolute -top-2 -right-2 animate-pulse">
                  {cartTotalItems}
                </span>
              )}
            </button>
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

        {/* Marketplace Stores */}
        <section aria-labelledby="marketplace-stores-title" className="overflow-hidden rounded-lg border border-white/10 bg-[#171717] shadow-xl">
          <div className="grid gap-6 border-b border-white/10 px-5 py-6 sm:px-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-8">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#268072]/30 bg-[#268072]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#82d6c5]">
                <Network className="h-3.5 w-3.5" />
                Integrated marketplace
              </div>
              <h2 id="marketplace-stores-title" className="font-headline-md text-2xl font-black text-white sm:text-3xl">
                Multiple trusted stores, one wholesale catalog
              </h2>
            </div>
            <p className="text-sm leading-6 text-white/60">
              Sacred Connection Wholesale is a marketplace that brings products from integrated partner stores into one ordering experience. Browse everything together; when an order is submitted, each store receives the items that belong to its own catalog.
            </p>
          </div>

          <div className="grid gap-4 p-5 sm:p-7 md:grid-cols-2 lg:p-8">
            <article className="group relative overflow-hidden rounded-md border border-[#268072]/35 bg-gradient-to-br from-[#173d36] to-[#111817] p-5 sm:p-6">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#268072]/20 blur-2xl" />
              <div className="relative flex h-full flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-14 w-32 items-center justify-center rounded border border-white/10 bg-black/30 px-3">
                    <img src="/logo.svg" alt="Sacred Connection" className="max-h-10 w-full object-contain" />
                  </div>
                  <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-emerald-200">
                    Integrated
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Sacred Connection</h3>
                  <p className="mt-1 text-sm leading-5 text-white/55">
                    The original wholesale catalog, focused on traditional botanical products and direct community relationships.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#82d6c5]">
                  <Store className="h-3.5 w-3.5" />
                  Marketplace store
                </div>
              </div>
            </article>

            <article className="group relative overflow-hidden rounded-md border border-[#cc6632] bg-[#cc6632] p-5 sm:p-6">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl" />
              <div className="relative flex h-full flex-col gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded border border-[#d8b879]/25 bg-black/25 text-lg font-black tracking-tight text-[#e0c38b]">
                    MH
                  </div>
                  <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-amber-100">
                    Integrated
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Maya Herbs</h3>
                  <p className="mt-1 text-sm leading-5 text-white/55">
                    An integrated partner store expanding the marketplace with its English-language wholesale selection.
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#e0c38b]">
                  <Store className="h-3.5 w-3.5" />
                  Partner store
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Filters Panel */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-sm p-5 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-label-sm">
            <Filter className="w-4 h-4 text-[#82d6c5]" />
            Filter Products
          </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 ${tribes.length > 0 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-5 lg:gap-6 items-end`}>
            
            {/* Search Input */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="search" className="text-xs text-white/55 font-semibold tracking-wide uppercase font-label-sm">
                Search
              </label>
              <div className="relative w-full">
                <input 
                  type="text" 
                  id="search"
                  placeholder="Name or SKU..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#131313] border border-white/10 rounded-sm py-4 pl-12 pr-4 text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#268072] transition-colors font-body-md"
                />
                <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="flex flex-col gap-2 w-full">
              <label htmlFor="category" className="text-xs text-white/55 font-semibold tracking-wide uppercase font-label-sm">
                Category
              </label>
              <div className="relative">
                <select 
                  id="category"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setTribe("All");
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#131313] border border-white/10 rounded-sm py-4 px-4 text-sm text-white focus:outline-none focus:border-[#268072] transition-colors font-body-md cursor-pointer appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "All" ? "All Categories" : cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                  ▼
                </div>
              </div>
            </div>

            {/* Tribe/Etnia Dropdown */}
            {tribes.length > 0 && (
              <div className="flex flex-col gap-2 w-full">
                <label htmlFor="tribe" className="text-xs text-white/55 font-semibold tracking-wide uppercase font-label-sm">
                  Indigenous Tribe
                </label>
                <div className="relative">
                  <select
                    id="tribe"
                    value={tribe}
                    onChange={(e) => {
                      setTribe(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-[#131313] border border-white/10 rounded-sm py-4 px-4 text-sm text-white focus:outline-none focus:border-[#268072] transition-colors font-body-md cursor-pointer appearance-none"
                  >
                    <option value="All">All Tribes</option>
                    {tribes.map((tb) => (
                      <option key={tb} value={tb}>{tb}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                    ▼
                  </div>
                </div>
              </div>
            )}

            {/* Clear Filters Button */}
            <div className="w-full">
              <button 
                onClick={handleClearFilters}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-300 py-4 px-6 rounded-sm text-sm font-bold tracking-wider uppercase text-white cursor-pointer"
              >
                Clear Filters
              </button>
            </div>

          </div>
        </div>

        {productsWarning && (
          <div role="status" className="rounded-sm border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-xs text-yellow-200">
            {productsWarning} Products from the available store are shown below.
          </div>
        )}

        {/* Product Table Grid */}
        <div ref={productListRef} className="border border-white/10 rounded-sm overflow-hidden bg-[#1a1a1a]">
          {/* Header Row */}
          <div className="hidden lg:grid grid-cols-12 gap-4 px-8 py-3 bg-[#131313] border-b border-white/10 text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">
            <div className="col-span-1">Image</div>
            <div className="col-span-4">Product details</div>
            <div className="col-span-2 text-center">SKU Code</div>
            <div className="col-span-1 text-right">Est. Price</div>
            <div className="col-span-4 text-right">Configure & Purchase</div>
          </div>

          {/* Product Items */}
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 lg:py-24 gap-4">
              <div className="w-10 h-10 border-4 border-[#268072] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">
                Loading live catalog…
              </p>
            </div>
          ) : productsError ? (
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
            <div className="flex flex-col gap-3 p-3 lg:block lg:divide-y lg:divide-white/10 lg:p-0">
              {paginatedProducts.map((product) => {
                const currentOptIdx = selectedOptions[product.id] !== undefined ? selectedOptions[product.id] : 0;
                return (
                  <div 
                    key={product.id}
                    className="catalog-product-row grid grid-cols-1 items-center gap-4 rounded-sm border border-white/10 bg-[#171717] px-4 py-6 shadow-sm shadow-black/20 transition-colors hover:bg-white/[0.01] sm:px-6 sm:py-6 lg:grid-cols-12 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-8 lg:shadow-none"
                  >
                    {/* Image Column — product thumbnail, tribe-letter fallback */}
                    <div className="col-span-1 lg:col-span-1 flex items-center">
                      <Link href={`/product/${product.id}?fromPage=${currentPage}`} className="block">
                        {product.image ? (
                          <div className="w-14 h-14 rounded-sm border border-white/10 hover:border-[#268072]/45 overflow-hidden relative shadow-md hover:shadow-lg transition-all duration-300 bg-[#131313]">
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-14 h-14 rounded-sm border border-white/10 hover:border-[#268072]/45 flex items-center justify-center text-lg font-black text-white select-none transition-all duration-300 relative shadow-md hover:shadow-lg font-mono uppercase"
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
                    <div className="col-span-1 lg:col-span-4 flex flex-col gap-1">
                      <Link href={`/product/${product.id}?fromPage=${currentPage}`} className="hover:text-[#82d6c5] transition-colors text-left no-underline group">
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

                    {/* SKU Column */}
                    <div className="col-span-1 lg:col-span-2 text-left lg:text-center">
                      <span className="break-all text-[11px] font-mono text-white/45 bg-[#131313] border border-white/5 px-2 py-1.5 rounded-sm tracking-wide">
                        {product.options[currentOptIdx]?.sku || product.sku}
                      </span>
                    </div>

                    {/* Price Column */}
                    <div className="col-span-1 lg:col-span-1 text-left lg:text-right">
                      <span className="catalog-product-price text-base font-bold text-[#82d6c5] font-headline-md whitespace-nowrap">
                        ${optionPriceForUser(product.options[currentOptIdx], user, product.category).toFixed(2)}
                      </span>
                    </div>

                    {/* Actions Column */}
                    <div className="col-span-1 lg:col-span-4 flex items-center justify-start lg:justify-end gap-3 flex-wrap lg:flex-nowrap">
                      {!product.optionsLoaded ? (
                        <button
                          type="button"
                          onClick={() => setOptionsProduct(product)}
                          className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm shadow-md transition-all border-0 cursor-pointer"
                        >
                          View options
                        </button>
                      ) : (
                        <>
                      {/* Option Select Dropdown */}
                      {product.options.length > 1 ? (
                        <select
                          value={currentOptIdx}
                          onChange={(e) => setSelectedOptions(prev => ({ ...prev, [product.id]: parseInt(e.target.value) }))}
                          className="w-full sm:w-auto bg-[#131313] border border-white/10 text-white text-xs rounded-sm px-3 py-2.5 focus:border-[#268072] outline-none sm:max-w-[180px] shrink-0"
                        >
                          {product.options.map((opt, idx) => (
                            <option key={opt.sku} value={idx}>
                              {opt.name} (${optionPriceForUser(opt, user, product.category).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] font-mono text-white/45 px-2 py-1.5 bg-white/5 border border-white/10 rounded-sm">
                          {product.options[0].name}
                        </span>
                      )}

                      {/* Quantity controls */}
                      <div className="flex items-center bg-[#131313] border border-white/10 rounded-sm shrink-0">
                        <button
                          onClick={() => setQuantities(prev => ({ ...prev, [product.id]: Math.max(1, (prev[product.id] || 1) - 1) }))}
                          className="p-1.5 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-white font-mono select-none">
                          {quantities[product.id] || 1}
                        </span>
                        <button
                          onClick={() => setQuantities(prev => ({ ...prev, [product.id]: (prev[product.id] || 1) + 1 }))}
                          className="p-1.5 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Add to Cart button */}
                      <button
                        onClick={() => {
                          const qty = quantities[product.id] || 1;
                          addToCart(product, currentOptIdx, qty);
                          setQuantities(prev => ({ ...prev, [product.id]: 1 }));
                          setIsCartOpen(true);
                        }}
                        className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-sm shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shrink-0"
                      >
                        Add
                      </button>
                        </>
                      )}
                    </div>

                  </div>
                );
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
      <ProductOptionsModal
        key={optionsProduct?.id || "closed-product-options"}
        product={optionsProduct}
        user={user}
        onClose={() => setOptionsProduct(null)}
        onAddToCart={(product, optionIndex, quantity) => {
          addToCart(product, optionIndex, quantity);
          setOptionsProduct(null);
          setIsCartOpen(true);
        }}
      />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
