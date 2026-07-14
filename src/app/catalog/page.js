"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationModal from "@/components/ApplicationModal";
import LoginModal from "@/components/LoginModal";
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
  PackageOpen
} from "lucide-react";

import { useProducts } from "@/components/ProductsContext";
import { optionPriceForUser } from "@/lib/pricing";
import { getEthnicityColor } from "@/lib/ethnicity-colors";

// Normalize string for accent-insensitive comparison
// Strips diacritics, lowercases and trims — used ONLY for comparison, never for display
const normalizeStr = (str) =>
  (str || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export default function CatalogPage() {
  const { products, loading: productsLoading, error: productsError, reload } = useProducts();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { addToCart, setIsCartOpen, cartTotalItems } = useCart();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // Inline Option and Quantity States
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantities, setQuantities] = useState({});

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [tribe, setTribe] = useState("All");

  // Read URL query parameters to set initial tribe filter and page
  // Resolve accent-insensitively against actual data so URL params always match
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tribeParam = params.get("tribe");
      if (tribeParam) {
        const match = products.find(
          (p) => normalizeStr(p.tribe) === normalizeStr(tribeParam)
        );
        setTribe(match ? match.tribe : tribeParam);
      }
      const pageParam = params.get("page");
      if (pageParam) {
        const pageNum = parseInt(pageParam);
        if (!isNaN(pageNum) && pageNum > 0) {
          setCurrentPage(pageNum);
        }
      }
    }
    // Re-resolve the tribe param when the live catalog swaps in, so URL
    // filters keep matching against the current dataset.
  }, [products]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
      if (!seen.has(key)) seen.set(key, p.category);
    });
    const unique = [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
    return ["All", "New Arrivals", ...unique];
  }, [products]);

  const tribes = useMemo(() => {
    const seen = new Map(); // normalised key → original string
    products.forEach((p) => {
      const key = normalizeStr(p.tribe);
      if (!seen.has(key)) seen.set(key, p.tribe);
    });
    const unique = [...seen.values()].sort((a, b) =>
      normalizeStr(a).localeCompare(normalizeStr(b))
    );
    return ["All", ...unique];
  }, [products]);

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
          category === "All" ||
          (category === "New Arrivals"
            ? product.isNew === true
            : normalizeStr(product.category) === normCat);
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

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch("");
    setCategory("All");
    setTribe("All");
    setCurrentPage(1);
  };

  // Catalog is partner-only: block until authenticated
  if (authLoading || !isLoggedIn) {
    return <AuthGate loading={authLoading} />;
  }

  return (
    <div className="bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header 
        onOpenLogin={() => setIsLoginOpen(true)} 
        onOpenApply={() => setIsApplyOpen(true)} 
      />

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
          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            {/* Download Catalog PDF Button */}
            <button 
              onClick={() => alert("Downloading Wholesale Catalog & Pricing PDF...")}
              className="flex items-center gap-3 bg-[#EC2300] hover:bg-[#c51d00] text-white border-0 py-3.5 px-6 rounded-sm text-sm font-bold tracking-wide uppercase transition-all duration-300 cursor-pointer shadow-lg shadow-[#EC2300]/15 grow sm:grow-0 justify-center"
            >
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PDF Catalog
            </button>

            {/* Quick Cart Summary Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 bg-[#1a1a1a] hover:bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 py-3.5 px-6 rounded-sm text-sm font-bold tracking-wide text-white uppercase relative cursor-pointer grow sm:grow-0 justify-center"
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

        {/* Filters Panel */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-sm p-5 sm:p-6 lg:p-8 flex flex-col gap-5 sm:gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-label-sm">
            <Filter className="w-4 h-4 text-[#82d6c5]" />
            Filter Products
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 items-end">
            
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
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#131313] border border-white/10 rounded-sm py-4 px-4 text-sm text-white focus:outline-none focus:border-[#268072] transition-colors font-body-md cursor-pointer appearance-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat === "All" ? "All Categories" : cat === "New Arrivals" ? "🆕 New Arrivals" : cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                  ▼
                </div>
              </div>
            </div>

            {/* Tribe/Etnia Dropdown */}
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
                  {tribes.map((tb) => (
                    <option key={tb} value={tb}>{tb === "All" ? "All Tribes" : tb}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/40">
                  ▼
                </div>
              </div>
            </div>

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
                We could not load the wholesale catalog right now. Please try again shortly.
              </p>
              <button
                onClick={reload}
                className="text-xs font-bold text-[#82d6c5] uppercase tracking-widest hover:underline bg-transparent border-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="divide-y divide-white/5">
              {paginatedProducts.map((product) => {
                const currentOptIdx = selectedOptions[product.id] !== undefined ? selectedOptions[product.id] : 0;
                return (
                  <div 
                    key={product.id}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center px-4 sm:px-6 lg:px-8 py-5 sm:py-6 hover:bg-white/[0.01] transition-colors"
                  >
                    {/* Image Column — product thumbnail, tribe-letter fallback */}
                    <div className="col-span-1 lg:col-span-1 flex items-center">
                      <Link href={`/product/${product.id}?fromPage=${currentPage}`} className="block">
                        {product.image ? (
                          <div className="w-14 h-14 rounded-full border border-white/10 hover:border-[#268072]/45 overflow-hidden relative shadow-md hover:shadow-lg transition-all duration-300 bg-[#131313]">
                            <img
                              src={product.image}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-14 h-14 rounded-full border border-white/10 hover:border-[#268072]/45 flex items-center justify-center text-lg font-black text-white select-none transition-all duration-300 relative shadow-md hover:shadow-lg font-mono uppercase"
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
                        <h3 className="font-headline-md text-lg font-bold text-white group-hover:text-[#82d6c5] transition-colors flex items-center gap-2 flex-wrap">
                          {product.name}
                          {product.isNew && (
                            <span className="inline-block text-[9px] font-black tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm uppercase align-middle">
                              New
                            </span>
                          )}
                        </h3>
                      </Link>
                      <div className="flex gap-2">
                        <span className="inline-block text-[10px] font-semibold bg-[#268072]/15 text-[#82d6c5] border border-[#268072]/30 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                          {product.category}
                        </span>
                        <span className="inline-block text-[10px] font-semibold bg-white/5 text-white/50 border border-white/10 px-2 py-0.5 rounded-sm uppercase tracking-wide font-label-sm">
                          {product.tribe}
                        </span>
                      </div>
                    </div>

                    {/* SKU Column */}
                    <div className="col-span-1 lg:col-span-2 text-left lg:text-center">
                      <span className="text-[11px] font-mono text-white/45 bg-[#131313] border border-white/5 px-2 py-1.5 rounded-sm tracking-wide">
                        {product.options[currentOptIdx]?.sku || product.sku}
                      </span>
                    </div>

                    {/* Price Column */}
                    <div className="col-span-1 lg:col-span-1 text-left lg:text-right">
                      <span className="text-base font-bold text-[#82d6c5] font-headline-md whitespace-nowrap">
                        ${optionPriceForUser(product.options[currentOptIdx], user, product.category).toFixed(2)}
                      </span>
                    </div>

                    {/* Actions Column */}
                    <div className="col-span-1 lg:col-span-4 flex items-center justify-start lg:justify-end gap-3 flex-wrap lg:flex-nowrap">
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
            <div className="flex justify-center items-center gap-4 py-8 border-t border-white/5 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-sm text-xs font-bold font-mono transition-all border cursor-pointer ${
                      currentPage === page
                        ? "bg-[#268072] text-white border-[#268072]"
                        : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-3 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 text-white border border-white/10 rounded-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Shared Modals */}
      <ApplicationModal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
      />
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
