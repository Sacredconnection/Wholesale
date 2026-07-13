"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ApplicationModal from "@/components/ApplicationModal";
import AuthGate from "@/components/AuthGate";
import { useProducts } from "@/components/ProductsContext";
import { optionPriceForUser } from "@/lib/pricing";
import { getEthnicityColor } from "@/lib/ethnicity-colors";
import { useCart } from "@/components/CartContext";
import { useAuth } from "@/components/AuthContext";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Minus, 
  Plus, 
  Check, 
  ShieldCheck, 
  Leaf, 
  Globe 
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPage = searchParams.get("fromPage") || "1";
  const { id } = params;

  const { addToCart, setIsCartOpen } = useCart();
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useProducts();

  // Find product from shared data (static fallback or live WooCommerce catalog)
  const product = products.find((p) => p.id === id);

  // Get related products randomly from the entire product list (excluding current product)
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (!product) return;

    // Filter out current product from all products
    const candidates = products.filter((p) => p.id !== product.id);

    // Shuffle and pick 4
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    setRelatedProducts(shuffled.slice(0, 4));
  }, [product, products]);

  // States
  const [selectedOptIdx, setSelectedOptIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Product pages are partner-only: block until authenticated
  if (authLoading || !isLoggedIn) {
    return <AuthGate loading={authLoading} />;
  }

  // Product not in the static catalog yet — it may exist only in WooCommerce,
  // so hold off on "not found" until the live catalog finishes loading.
  if (!product && productsLoading) {
    return (
      <div className="bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} onOpenApply={() => setIsApplyOpen(true)} />
        <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-24 flex flex-col items-center justify-center text-center gap-4">
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
      <div className="bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
        <Header onOpenLogin={() => setIsLoginOpen(true)} onOpenApply={() => setIsApplyOpen(true)} />
        <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-24 flex flex-col items-center justify-center text-center gap-6">
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
  const provenanceColor = getEthnicityColor(product.tribe, product.category);

  // Pricing calculations with discount
  const basePrice = optionPriceForUser(selectedOption, user, product.category);
  const discountPercentage = isLoggedIn && user ? user.discountRate : 0;
  const discountAmount = basePrice * (discountPercentage / 100);
  const finalPrice = basePrice - discountAmount;

  const handleAddToCartClick = () => {
    addToCart(product, selectedOptIdx, quantity);
    setIsCartOpen(true);
  };

  return (
    <div className="bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased justify-between">
      <Header onOpenLogin={() => setIsLoginOpen(true)} onOpenApply={() => setIsApplyOpen(true)} />

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-8">
        
        {/* Breadcrumbs / Back button */}
        <div className="flex items-center gap-2 text-xs text-white/50 font-mono flex-wrap">
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
          <span className="text-white/30 capitalize">{product.category}</span>
          <span>/</span>
          <span className="text-white/80">{product.name}</span>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch mt-4 bg-[#1a1a1a] border border-white/10 rounded-lg p-6 md:p-8 shadow-2xl">
          
          {/* Left Column: Image and provenance */}
          <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-lg aspect-square flex items-center justify-center relative overflow-hidden group select-none">
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

            <div
              className="hidden lg:flex flex-1 min-h-36 relative overflow-hidden rounded-lg border border-white/15 p-6 flex-col justify-between"
              style={{
                backgroundColor: provenanceColor,
                backgroundImage: "linear-gradient(135deg, rgba(0,0,0,0.08), rgba(0,0,0,0.45))",
              }}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-center bg-cover bg-no-repeat opacity-[0.08]"
                style={{ backgroundImage: "url('/product-watermarks/provenance-watermark.svg')" }}
              ></div>
              <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-white/10"></div>
              <div className="absolute -right-2 -top-8 h-28 w-28 rounded-full border border-white/10"></div>
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10">
                  <Leaf className="h-5 w-5 text-white/80" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/35">
                  Sacred provenance
                </span>
              </div>
              <div className="relative mt-6">
                <span className="text-[10px] font-mono uppercase tracking-wider text-white/60">
                  Origin
                </span>
                <h2 className="mt-1 text-2xl font-bold text-white font-headline-md">
                  {product.tribe}
                </h2>
                <p className="mt-2 text-xs text-white/45">Direct Indigenous Trade · Fair compensation share</p>
              </div>
            </div>
          </div>

          {/* Right Column: Content and Options */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Product Meta Category & Tribe Badges */}
            <div className="flex gap-2.5">
              <span className="inline-block text-[10px] font-bold bg-[#268072]/15 text-[#82d6c5] border border-[#268072]/30 px-3 py-1 rounded-full uppercase tracking-wider font-label-sm">
                {product.category}
              </span>
              <span className="inline-block text-[10px] font-bold bg-white/5 text-white/60 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider font-label-sm">
                Origin: {product.tribe}
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
            <div className="bg-[#1a1a1a] border border-white/5 p-5 rounded-md flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-white/45 uppercase block">Est. B2B Unit Cost</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-[#82d6c5] font-headline-lg">
                    ${finalPrice.toFixed(2)}
                  </span>
                  {isLoggedIn && user && (
                    <span className="text-xs font-mono text-white/40 line-through">
                      ${basePrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {isLoggedIn && user ? (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-2.5 py-1 rounded-sm uppercase tracking-wider">
                  Partner {user.discountRate}% Off
                </span>
              ) : (
                <button 
                  onClick={() => setIsLoginOpen(true)}
                  className="text-[10px] font-mono text-[#82d6c5] hover:text-white underline bg-transparent border-0 cursor-pointer"
                >
                  Log in for partner discounts
                </button>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                Product Description
              </span>
              <p className="font-body-md text-sm text-white/70 leading-relaxed">
                {product.description || "Premium wholesale ritual medicine sourced directly through equitable fair-trade agreements with Amazonian community associations. Harvested and processed using traditional forest milling protocols."}
              </p>
            </div>

            <div className="h-px bg-white/10 my-1"></div>

            {/* Options Selection form */}
            <div className="flex flex-col gap-4">
              
              {/* Size Select Dropdown */}
              {product.options.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                    Weight / Packaging Size
                  </label>
                  <select
                    value={selectedOptIdx}
                    onChange={(e) => setSelectedOptIdx(parseInt(e.target.value))}
                    className="bg-[#1a1a1a] border border-white/10 text-sm text-white rounded px-4 py-3.5 focus:border-[#268072] outline-none w-full"
                  >
                    {product.options.map((opt, idx) => (
                      <option key={opt.sku} value={idx}>
                        {opt.name} (${optionPriceForUser(opt, user, product.category).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Purchase Box */}
              <div className="flex items-center gap-4 mt-2">
                
                {/* Quantity select */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-mono text-white/45 uppercase tracking-wider font-label-sm">
                    Quantity
                  </span>
                  <div className="flex items-center bg-[#1a1a1a] border border-white/10 rounded">
                    <button
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                      className="p-3 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-white font-mono select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="p-3 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Basket button */}
                <div className="flex-grow flex flex-col gap-1.5 justify-end h-full pt-5">
                  <button
                    onClick={handleAddToCartClick}
                    className="w-full bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-widest py-4 px-6 rounded shadow-lg shadow-[#EC2300]/20 hover:shadow-[#EC2300]/45 transition-all flex items-center justify-center gap-2 cursor-pointer border-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Basket
                  </button>
                </div>

              </div>

            </div>

            <div className="h-px bg-white/10 my-1"></div>

            {/* B2B Certifications Trust Flags */}
            <div className="grid grid-cols-2 gap-4 mt-2">
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
          <div className="bg-[#1a1a1a] border border-white/5 rounded-sm p-6 md:p-8 my-8 shadow-2xl">
          <h2 className="text-white text-2xl font-bold font-headline-md mb-8">Related products</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => {
              // Find min and max price
              const prices = p.options.map(opt => optionPriceForUser(opt, user, p.category));
              const minPrice = Math.min(...prices);
              const maxPrice = Math.max(...prices);
              
              // Format the name to start with "Rapé" if it ends with "Rapeh"
              let displayName = p.name;
              if (displayName.endsWith(" Rapeh")) {
                const baseName = displayName.slice(0, -6);
                displayName = `Rapé ${baseName}`;
              }

              return (
                <div key={p.id} className="bg-[#131313] border border-white/5 rounded-sm p-5 flex flex-col gap-4 hover:border-[#268072]/30 hover:shadow-lg hover:shadow-[#268072]/5 transition-all duration-300 group text-left">
                  {/* Product Image */}
                  <Link href={`/product/${p.id}?fromPage=${fromPage}`} className="block aspect-square overflow-hidden rounded-sm bg-[#1a1a1a] border border-white/5 relative">
                    <img
                      src={p.image || `/products/${p.photoFolder}/${p.photo}.jpg`}
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
                    <Link href={`/product/${p.id}?fromPage=${fromPage}`} className="font-headline-md text-base font-bold text-white group-hover:text-[#82d6c5] transition-colors line-clamp-2 no-underline min-h-[48px] flex items-center">
                      {displayName}
                    </Link>
                    
                    {/* Price Range */}
                    <span className="text-[#82d6c5] font-headline-md font-bold text-sm">
                      ${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}
                    </span>
                  </div>
                  
                  {/* Select Options Button */}
                  <div className="mt-auto pt-2">
                    <Link href={`/product/${p.id}?fromPage=${fromPage}`} className="w-full inline-block text-center bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] py-3.5 px-4 rounded-sm transition-colors uppercase tracking-widest no-underline border border-white/10 font-label-sm">
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
      <ApplicationModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
    </div>
  );
}
