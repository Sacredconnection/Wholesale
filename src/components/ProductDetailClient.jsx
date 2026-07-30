"use client";

/* eslint-disable @next/next/no-img-element -- Runtime product URLs require native image fallbacks. */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import StockBackorderNotice from "@/components/StockBackorderNotice";
import { useProducts } from "@/components/ProductsContext";
import {
  optionPriceForUser,
  quantityStepForWeight,
} from "@/lib/pricing";
import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthContext";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Minus,
  Plus,
  ShieldCheck,
  Globe
} from "lucide-react";

export default function ProductDetailClient({ initialProduct }) {
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("fromPage") || "1";

  const { addToCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { products, loading: productsLoading } = useProducts();

  // Start with the server-rendered public product, then upgrade it with
  // account-specific pricing after authentication is restored.
  const liveProduct = products.find(
    (p) =>
      p.slug === initialProduct?.slug ||
      p.id === initialProduct?.id
  );
  const catalogProduct = liveProduct || initialProduct;
  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [productLoadError, setProductLoadError] = useState("");
  const [selectedOptIdx, setSelectedOptIdx] = useState(0);
  const [quantity, setQuantity] = useState(() =>
    quantityStepForWeight(initialProduct?.options?.[0]?.weightGrams)
  );
  const [addedAt, setAddedAt] = useState(0);
  const resolvedPricingMatches =
    resolvedProduct?.id === catalogProduct?.id &&
    (isLoggedIn
      ? resolvedProduct?.pricingVisible === true
      : resolvedProduct?.pricingVisible !== true);
  const product = resolvedPricingMatches ? resolvedProduct : catalogProduct;

  useEffect(() => {
    const hasCorrectPricing =
      !isLoggedIn || catalogProduct?.pricingVisible === true;
    if (!catalogProduct || (catalogProduct.optionsLoaded && hasCorrectPricing)) {
      return undefined;
    }

    let cancelled = false;

    async function loadProductOptions() {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(catalogProduct.slug)}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not load this product's options.");
        }
        if (!cancelled) {
          setResolvedProduct(data.product);
          setSelectedOptIdx(0);
          setQuantity(
            quantityStepForWeight(data.product.options?.[0]?.weightGrams)
          );
        }
      } catch (error) {
        if (!cancelled) {
          setProductLoadError(
            error.name === "TimeoutError"
              ? "This product's options took too long to load. Please try again."
              : error.message
          );
        }
      }
    }

    loadProductOptions();
    return () => {
      cancelled = true;
    };
  }, [catalogProduct, isLoggedIn]);

  const relatedProductPool = useMemo(() => {
    if (!product) return [];

    return products.filter((item) => item.id !== product.id);
  }, [product, products]);

  // States
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const relatedCarouselRef = useRef(null);
  const [relatedControls, setRelatedControls] = useState({ previous: false, next: false });

  useEffect(() => {
    if (!addedAt) return undefined;
    const timer = window.setTimeout(() => setAddedAt(0), 1800);
    return () => window.clearTimeout(timer);
  }, [addedAt]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const shuffledProducts = [...relatedProductPool];

      for (let index = shuffledProducts.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffledProducts[index], shuffledProducts[randomIndex]] = [
          shuffledProducts[randomIndex],
          shuffledProducts[index],
        ];
      }

      setRelatedProducts(shuffledProducts.slice(0, 12));
    });

    return () => cancelAnimationFrame(frame);
  }, [relatedProductPool]);

  useEffect(() => {
    const carousel = relatedCarouselRef.current;
    if (!carousel) return undefined;

    const updateControls = () => {
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      setRelatedControls({
        previous: carousel.scrollLeft > 4,
        next: carousel.scrollLeft < maxScroll - 4,
      });
    };

    carousel.scrollTo({ left: 0 });
    const frame = requestAnimationFrame(updateControls);
    window.addEventListener("resize", updateControls);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateControls);
    };
  }, [isLoggedIn, relatedProducts.length, product?.id]);

  const activeQuantityStep = quantityStepForWeight(
    product?.options?.[selectedOptIdx]?.weightGrams
  );
  // Product not in the static catalog yet — it may exist only in WooCommerce,
  // so hold off on "not found" until the live catalog finishes loading.
  if (!product && productsLoading) {
    return (
      <div id="top" className="site-background-page bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} />
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-10 h-10 border-2 border-[#268072] border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-xs font-mono uppercase tracking-widest">Loading product…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // If product doesn't exist
  if (!product) {
    return (
      <div id="top" className="site-background-page bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} />
        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 flex flex-col items-center justify-center text-center gap-6">
          <div className="text-6xl">⚠️</div>
          <h2 className="font-headline-md text-3xl font-bold text-white">Product Not Found</h2>
          <p className="text-white/60 text-sm max-w-md">
            The wholesale remedy you are looking for does not exist or has been removed from our inventory.
          </p>
          <Link
            href="/catalog"
            className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-wider py-4 px-8 rounded-sm transition-all animate-fade-in"
          >
            Back to Catalog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const selectedOption = product.options[selectedOptIdx];
  const quantityStep = activeQuantityStep;
  const canPurchase = Boolean(
    isLoggedIn &&
      user &&
      product.pricingVisible === true &&
      selectedOption?.price != null
  );
  const productDescription = product.description || "Wholesale botanical product sourced through equitable fair-trade agreements with Amazonian community associations and prepared using established local production methods.";
  const hasLongDescription = productDescription.length > 280;

  // Pricing calculations with discount
  const basePrice =
    canPurchase
      ? optionPriceForUser(selectedOption, user, product.category)
      : null;
  const discountPercentage = isLoggedIn && user ? user.discountRate : 0;
  const discountAmount =
    basePrice == null ? null : basePrice * (discountPercentage / 100);
  const finalPrice =
    basePrice == null ? null : basePrice - discountAmount;
  const minimumPackTotal =
    finalPrice == null ? null : finalPrice * quantityStep;
  const selectedTotal =
    finalPrice == null ? null : finalPrice * quantity;

  const handleAddToCartClick = () => {
    if (!canPurchase || !product.optionsLoaded) {
      if (!isLoggedIn) setIsLoginOpen(true);
      return;
    }
    addToCart(product, selectedOptIdx, quantity);
    setAddedAt(Date.now());
  };

  const scrollRelatedProducts = (direction) => {
    const carousel = relatedCarouselRef.current;
    const firstCard = carousel?.querySelector("[data-related-product]");
    if (!carousel || !firstCard) return;

    const gap = Number.parseFloat(window.getComputedStyle(carousel).columnGap) || 0;
    const distance = firstCard.getBoundingClientRect().width + gap;
    carousel.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <div id="top" className="site-background-page bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col gap-10 sm:gap-12">

        {/* Breadcrumbs / Back button */}
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-white/50 font-mono">
          <Link href={`/catalog?page=${fromPage}`} className="flex items-center gap-1.5 hover:text-white transition-colors no-underline">
            <ArrowLeft className="w-4.5 h-4.5" />
            Back to Wholesale Catalog (Page {fromPage})
          </Link>
          {fromPage !== "1" && (
            <>
              <span>·</span>
              <Link href="/catalog" className="hover:text-white transition-colors no-underline">
                First Page
              </Link>
            </>
          )}
          <span>/</span>
          <span className="break-words text-white/30 capitalize">{product.category}</span>
          <span>/</span>
          <span className="min-w-0 break-words text-white/80">{product.name}</span>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start bg-[#1a1a1a] border border-white/10 rounded-xl p-5 sm:p-6 md:p-8 shadow-2xl">
          {/* Product image */}
          <div className="lg:col-span-6 w-full">
          <div className="bg-white rounded-lg aspect-square flex items-center justify-center relative overflow-hidden group select-none shadow-lg shadow-black/15">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#268072]/5 via-transparent to-transparent opacity-60 z-0"></div>
            {/* Real Product Image with Fallback */}
            {!imgError ? (
              <div className="w-full h-full overflow-hidden rounded-lg bg-white relative z-10">
                <img
                  src={product.image || `/products/${product.photoFolder}/${product.photo}.jpg`}
                  alt={product.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center px-8 relative z-10">
                <div className="w-16 h-16 rounded-full bg-[#268072]/15 border border-[#268072]/30 flex items-center justify-center text-2xl text-[#82d6c5]">
                  📷
                </div>
                <span className="text-[#82d6c5] text-xs font-bold uppercase tracking-widest block mt-2">
                  No Image Uploaded
                </span>
                <span className="text-[10px] text-white/35 font-mono leading-relaxed block max-w-xs">
                  Upload a 900x900 jpg image to:<br />
                  <code className="text-[#82d6c5] bg-black/40 px-1.5 py-0.5 rounded block mt-1.5 break-all select-all">
                    /public/products/{product.photoFolder}/{product.photo}.jpg
                  </code>
                </span>
              </div>
            )}
          </div>

          </div>

          {/* Right Column: Content and Options */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* Product Meta Category & Tribe Badges */}
            <div className="flex flex-wrap gap-2.5">
              <span className="inline-block text-[10px] font-bold bg-[#268072]/15 text-[#82d6c5] border border-[#268072]/30 px-3 py-1 rounded-full uppercase tracking-wider font-label-sm">
                {product.category}
              </span>
              {product.tribe && (
                <span className="inline-block text-[10px] font-bold bg-white/5 text-white/60 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider font-label-sm">
                  Origin: {product.tribe}
                </span>
              )}
              <span className="inline-block text-[10px] font-bold text-white/45 px-2 py-1 uppercase tracking-wider font-label-sm">
                Store: {product.storeName}
              </span>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="font-headline-lg text-3xl md:text-4xl font-black text-white leading-tight">
                {product.name}
              </h1>
              <p className="text-[11px] font-mono text-white/40 mt-1">
                SKU: <span className="text-white/60 font-bold">{selectedOption?.sku || product.sku}</span>
              </p>
            </div>

            {/* Price display */}
            <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
              {canPurchase && finalPrice != null ? (
                <>
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-white/45">
                      Est. B2B Unit Cost
                    </span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="font-headline-lg text-3xl font-black text-[#82d6c5]">
                        ${finalPrice.toFixed(2)}
                      </span>
                      {discountPercentage > 0 && (
                        <span className="text-xs font-mono text-white/40 line-through">
                          ${basePrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {quantityStep > 1 && minimumPackTotal != null && (
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <span className="block text-[10px] font-mono uppercase text-white/45">
                          Minimum pack · {quantityStep} units
                        </span>
                        <strong className="mt-1 block text-xl font-black text-[#82d6c5]">
                          ${minimumPackTotal.toFixed(2)}
                        </strong>
                      </div>
                    )}
                  </div>
                  <span className="rounded-sm border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    Partner {user.discountRate}% Off
                  </span>
                </>
              ) : (
                <>
                  <div>
                    <span className="block text-[10px] font-mono uppercase text-white/45">
                      Partner pricing
                    </span>
                    <p className="mt-1 text-sm font-semibold text-white">
                      Available to approved wholesale accounts
                    </p>
                  </div>
                  {!isLoggedIn ? (
                  <button
                    type="button"
                    onClick={() => setIsLoginOpen(true)}
                    className="rounded-sm border border-[#82d6c5]/35 bg-[#268072]/15 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#82d6c5] transition-colors hover:bg-[#268072]/30 hover:text-white"
                  >
                    Sign in to view pricing
                  </button>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#82d6c5]">
                      Loading your account pricing…
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                Product Description
              </span>
              <p className={`font-body-md text-sm text-white/70 leading-relaxed ${!isDescriptionExpanded && hasLongDescription ? "line-clamp-5 sm:line-clamp-4" : ""}`}>
                {productDescription}
              </p>
              {hasLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
                  aria-expanded={isDescriptionExpanded}
                  className="self-start bg-transparent border-0 p-0 text-[10px] font-bold uppercase tracking-wider text-[#82d6c5] hover:text-white transition-colors cursor-pointer"
                >
                  {isDescriptionExpanded ? "Show less" : "Read full description"}
                </button>
              )}
            </div>

            <div className="h-px bg-white/10 my-1"></div>

            {/* Options Selection form */}
            <div className="flex flex-col gap-4">
              {/* Size Select Dropdown */}
              {!product.optionsLoaded ? (
                <div className="rounded border border-[#82d6c5]/20 bg-[#82d6c5]/5 px-4 py-3 text-xs text-[#82d6c5]">
                  {productLoadError || "Loading product options..."}
                </div>
              ) : product.options.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                    Weight / Packaging Size
                  </label>
                  <select
                    value={selectedOptIdx}
                    onChange={(event) => {
                      const nextIndex = Number(event.target.value);
                      setSelectedOptIdx(nextIndex);
                      setAddedAt(0);
                      setQuantity(
                        quantityStepForWeight(
                          product.options[nextIndex]?.weightGrams
                        )
                      );
                    }}
                    className="bg-[#1a1a1a] border border-white/10 text-sm text-white rounded px-4 py-3.5 focus:border-[#268072] outline-none w-full"
                  >
                    {product.options.map((opt, idx) => (
                      <option key={opt.sku} value={idx}>
                        {opt.name}
                        {canPurchase && opt.price != null
                          ? ` ($${optionPriceForUser(opt, user, product.category).toFixed(2)})`
                          : ""}
                        {opt.inStock === false ? " · Out of stock" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedOption?.inStock === false && <StockBackorderNotice />}
              {quantityStep > 1 && selectedOption && (
                <p className="text-[10px] font-semibold text-[#82d6c5]">
                  This {Math.round(selectedOption.weightGrams)}g tin is sold in
                  multiples of {quantityStep} units.
                </p>
              )}

              {/* Purchase Box */}
              {canPurchase ? (
              <div className="flex flex-col gap-3 mt-1">
                {quantityStep > 1 && selectedTotal != null && (
                  <div className="flex items-center justify-between rounded border border-white/5 bg-black/15 px-3 py-2 text-[10px]">
                    <span className="font-mono uppercase tracking-wider text-white/45">
                      Selected total · {quantity} units
                    </span>
                    <strong className="text-sm text-[#82d6c5]">
                      ${selectedTotal.toFixed(2)}
                    </strong>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                {/* Quantity select */}
                <div className="flex flex-col gap-1.5 sm:shrink-0">
                  <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                    Quantity
                  </span>
                  <div className="flex items-center justify-between sm:justify-start bg-[#1a1a1a] border border-white/10 rounded">
                    <button
                      onClick={() =>
                        setQuantity((previous) =>
                          Math.max(quantityStep, previous - quantityStep)
                        )
                      }
                      className="p-3 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-white font-mono select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((previous) => previous + quantityStep)
                      }
                      className="p-3 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Basket button */}
                <div className="flex-grow w-full">
                  <button
                    onClick={handleAddToCartClick}
                    disabled={!product.optionsLoaded}
                    className="w-full bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-widest py-4 px-6 rounded shadow-lg shadow-[#EC2300]/20 hover:shadow-[#EC2300]/45 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    {addedAt ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <ShoppingBag className="w-4 h-4" />
                    )}
                    {addedAt
                      ? "Added to order"
                      : product.optionsLoaded
                      ? selectedOption?.inStock === false
                        ? "Order for restock"
                        : "Add to Basket"
                      : "Loading options..."}
                  </button>
                </div>

                </div>
              </div>
              ) : !isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded bg-[#EC2300] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-[#EC2300]/20 transition-colors hover:bg-[#c51d00]"
                >
                  <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  Sign in to order
                </button>
              ) : (
                <div className="rounded border border-[#82d6c5]/20 bg-[#82d6c5]/5 px-4 py-3 text-center text-xs font-semibold text-[#82d6c5]">
                  Loading your account pricing…
                </div>
              )}

            </div>

            <div className="h-px bg-white/10 my-1"></div>

            {/* B2B Certifications Trust Flags */}
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#82d6c5] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-white block">Sustainably Harvested</span>
                  <span className="text-[10px] text-white/40 leading-relaxed block">Honoring natural cycles</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Globe className="w-5 h-5 text-[#82d6c5] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[11px] font-bold text-white block">Direct Indigenous Trade</span>
                  <span className="text-[10px] text-white/40 leading-relaxed block">Fair compensation share</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="bg-[#1a1a1a] border border-white/5 rounded-xl p-5 sm:p-6 md:p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
            <h2 className="text-white text-2xl font-bold font-headline-md">Related products</h2>
            <div className="flex shrink-0 items-center gap-2" aria-label="Related product carousel controls">
              <button
                type="button"
                onClick={() => scrollRelatedProducts(-1)}
                disabled={!relatedControls.previous}
                aria-label="Show previous related product"
                className="related-carousel-button grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#131313] text-[#82d6c5] shadow-lg transition-colors hover:border-[#82d6c5] hover:text-[#9ef2e1] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollRelatedProducts(1)}
                disabled={!relatedControls.next}
                aria-label="Show next related product"
                className="related-carousel-button grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-[#131313] text-[#82d6c5] shadow-lg transition-colors hover:border-[#82d6c5] hover:text-[#9ef2e1] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            ref={relatedCarouselRef}
            onScroll={(event) => {
              const carousel = event.currentTarget;
              const maxScroll = carousel.scrollWidth - carousel.clientWidth;
              setRelatedControls({
                previous: carousel.scrollLeft > 4,
                next: carousel.scrollLeft < maxScroll - 4,
              });
            }}
            className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 touch-pan-x sm:gap-5 lg:gap-6"
            aria-label="Related products"
          >
            {relatedProducts.map((p) => {
              const prices =
                isLoggedIn && user
                  ? p.options
                      .filter((option) => option.price != null)
                      .map((option) =>
                        optionPriceForUser(option, user, p.category)
                      )
                  : [];
              const minPrice = prices.length ? Math.min(...prices) : null;
              const maxPrice = prices.length ? Math.max(...prices) : null;
              // Format the name to start with "Rapé" if it ends with "Rapeh"
              let displayName = p.name;
              if (displayName.endsWith(" Rapeh")) {
                const baseName = displayName.slice(0, -6);
                displayName = `Rapé ${baseName}`;
              }

              return (
                <div
                  key={p.id}
                  data-related-product
                  className="group flex min-w-[86%] snap-start flex-col gap-4 rounded-lg border border-white/5 bg-[#131313] p-5 text-left transition-all duration-300 hover:border-[#268072]/30 hover:shadow-lg hover:shadow-[#268072]/5 sm:min-w-[calc(50%_-_10px)] lg:min-w-[calc(25%_-_18px)]"
                >
                  {/* Product Image */}
                  <Link href={`/product/${p.slug}?fromPage=${fromPage}`} className="block aspect-square overflow-hidden rounded-lg bg-[#1a1a1a] border border-white/5 relative">
                    <img
                      src={p.image || "/logo.svg"}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = "/logo.svg";
                        e.target.className = "w-full h-full object-contain p-8 opacity-20";
                      }}
                    />
                  </Link>
                  <div className="flex flex-col gap-2">
                    {/* Product Title */}
                    <Link href={`/product/${p.slug}?fromPage=${fromPage}`} className="font-headline-md text-base font-bold text-white group-hover:text-[#82d6c5] transition-colors line-clamp-2 no-underline min-h-[48px] flex items-center">
                      {displayName}
                    </Link>
                    {/* Price Range */}
                    {isLoggedIn && user && minPrice != null && maxPrice != null ? (
                    <span className="text-[#82d6c5] font-headline-md font-bold text-sm">
                      ${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}
                    </span>
                    ) : (
                      <span className="text-xs font-semibold text-white/50">
                        Sign in to view partner pricing
                      </span>
                    )}
                  </div>

                  {/* Select Options Button */}
                  <div className="mt-auto pt-2">
                    <Link href={`/product/${p.slug}?fromPage=${fromPage}`} className="w-full inline-block text-center bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] py-3.5 px-4 rounded-sm transition-colors uppercase tracking-widest no-underline border border-white/10 font-label-sm">
                      Select options
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

      </main>

      <Footer />

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
