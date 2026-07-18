"use client";

/* eslint-disable @next/next/no-img-element -- Cart images retain runtime WooCommerce error fallbacks. */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import LoginModal from './LoginModal';
import { ShoppingBag, X, Minus, Plus, ArrowRight, PhoneCall, Loader2, Scale } from 'lucide-react';
import { MIN_ORDER_GRAMS, NEW_CUSTOMER_ROLE, progressivePerGramRate, progressiveTableKeyFor } from '@/lib/pricing';

export default function CartDrawer() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartTotalItems,
    cartTotalWeightGrams
  } = useCart();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  if (!isCartOpen && !isLoginOpen) return null;

  const meetsMinimumWeight = cartTotalWeightGrams >= MIN_ORDER_GRAMS;

  // Progressive per-gram tiers applied to New Customer orders (by total
  // weight) — one rate per product line present in the cart.
  const perGramRates =
    isLoggedIn && user?.role === NEW_CUSTOMER_ROLE
      ? [...new Set(cart.filter((i) => i.weightGrams > 0).map((i) => progressiveTableKeyFor(i.category)))]
          .map((tableKey) => ({
            tableKey,
            label: tableKey === "shamanic" ? "SHAMANIC" : "INDIGENOUS",
            rate: progressivePerGramRate(cartTotalWeightGrams, tableKey),
          }))
          .filter((r) => r.rate != null)
      : [];

  const handleCheckout = async () => {
    if (!isLoggedIn || !user) {
      setIsLoginOpen(true);
      return;
    }
    if (!meetsMinimumWeight) return;

    setIsSubmitting(true);
    setOrderError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(({ sku, quantity, wcProductId, wcVariationId }) => ({
            sku,
            quantity,
            wcProductId,
            wcVariationId,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Order submission failed. Please try again.");
      }

      clearCart();
      setIsCartOpen(false);
      router.push(
        `/order-received?number=${encodeURIComponent(data.order.number)}&total=${encodeURIComponent(data.order.total)}`
      );
    } catch (err) {
      setOrderError(err.message || "Order submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const discountPercentage = isLoggedIn && user ? user.discountRate : 0;
  const discountAmount = cartSubtotal * (discountPercentage / 100);
  const finalTotal = cartSubtotal - discountAmount;

  return (
    <>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          ></div>

          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#1a1a1a] border-l border-white/10 shadow-2xl flex flex-col justify-between animate-fade-in-left">
            
            {/* Header */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-white/10 flex justify-between items-center bg-[#131313]">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-[#82d6c5]" />
                <h3 className="font-headline-md text-xl font-bold text-white">
                  Bulk Order Sheet
                </h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: Cart Items */}
            <div className="flex-grow overflow-y-auto px-5 sm:px-8 py-5 sm:py-6 flex flex-col gap-5 sm:gap-6 scrollbar-none">
              {cart.length > 0 ? (
                <div className="flex flex-col gap-5 divide-y divide-white/5">
                  {cart.map((item, index) => (
                    <div key={item.sku} className={`flex flex-col items-start justify-between gap-4 sm:flex-row ${index > 0 ? "pt-5" : ""}`}>
                      <div className="flex w-full min-w-0 flex-grow gap-3">
                        <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0 select-none overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.textContent = "🍃";
                              }}
                            />
                          ) : (
                            "🍃"
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {item.name}
                          </h4>
                          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold bg-[#268072]/10 text-[#82d6c5] border border-[#268072]/30 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              {item.optionName}
                            </span>
                            <span className="break-all text-[10px] font-mono text-white/35">
                              {item.sku}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full min-w-0 shrink-0 flex-row items-center justify-between gap-3 sm:h-full sm:w-auto sm:min-w-[100px] sm:flex-col sm:items-end">
                        <span className="text-sm font-bold text-white font-mono">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        
                        {/* Quantity controls */}
                        <div className="flex items-center bg-[#131313] border border-white/10 rounded-sm">
                          <button
                            onClick={() => updateQuantity(item.sku, -1)}
                            className="p-1.5 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-white font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.sku, 1)}
                            className="p-1.5 text-white/50 hover:text-white cursor-pointer bg-transparent border-0"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button 
                          onClick={() => removeFromCart(item.sku)}
                          className="text-[10px] text-white/35 hover:text-[#e02401] uppercase tracking-wider font-semibold transition-colors cursor-pointer bg-transparent border-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center gap-4 text-white/30">
                  <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
                  <p className="text-sm font-semibold">Your B2B order sheet is currently empty.</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="text-xs font-bold text-[#82d6c5] uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Browse Catalog
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary */}
            <div className="px-5 sm:px-8 py-5 sm:py-6 bg-[#131313] border-t border-white/10 flex flex-col gap-5 sm:gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-white/50 uppercase tracking-wider font-label-sm">
                  <span>Total Items</span>
                  <span className="font-bold text-white font-mono">{cartTotalItems}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/50 font-mono">
                  <span>EST. WEIGHT</span>
                  <span className={`font-bold font-mono ${meetsMinimumWeight ? "text-white" : "text-yellow-400"}`}>
                    {cartTotalWeightGrams >= 1000
                      ? `${(cartTotalWeightGrams / 1000).toFixed(2)} kg`
                      : `${Math.round(cartTotalWeightGrams)} g`
                    }
                  </span>
                </div>

                {perGramRates.map(({ tableKey, label, rate }) => (
                  <div key={tableKey} className="flex justify-between items-center text-xs text-[#82d6c5] font-mono">
                    <span>VOLUME RATE — {label}</span>
                    <span className="font-bold">${rate.toFixed(2)}/g</span>
                  </div>
                ))}

                {/* Minimum order weight indicator */}
                {cart.length > 0 && !meetsMinimumWeight && (
                  <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 text-[11px] px-3 py-2.5 rounded-sm mt-1">
                    <Scale className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Minimum wholesale order is <strong>{MIN_ORDER_GRAMS}g</strong> — add{" "}
                      {Math.ceil(MIN_ORDER_GRAMS - cartTotalWeightGrams)}g more to submit.
                    </span>
                  </div>
                )}
                
                {isLoggedIn && user && (
                  <div className="flex justify-between items-center text-xs text-[#82d6c5] font-mono mt-1">
                    <span>B2B DISCOUNT ({user.discountRate}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div className="h-px bg-white/5 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-white uppercase tracking-widest font-label-sm">
                    {isLoggedIn && user ? 'Est. Partner Total' : 'Est. Subtotal'}
                  </span>
                  <span className="text-2xl font-black text-[#82d6c5] font-headline-lg">
                    ${(isLoggedIn && user ? finalTotal : cartSubtotal).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Offline payment notice */}
              <div className="bg-[#268072]/10 border border-[#268072]/25 rounded-sm px-4 py-3 flex items-start gap-3">
                <PhoneCall className="w-4 h-4 text-[#82d6c5] shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/70 leading-relaxed">
                  No online payment is taken. Once submitted, your order is registered
                  and a member of our team will contact you to arrange payment and shipping.
                </p>
              </div>

              {orderError && (
                <div className="bg-[#93000a]/15 border border-[#ffb4ab]/25 text-[#ffb4ab] text-xs px-4 py-3 rounded-sm leading-relaxed">
                  {orderError}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting || (isLoggedIn && !meetsMinimumWeight)}
                className="w-full bg-[#EC2300] hover:bg-[#c51d00] disabled:opacity-40 disabled:hover:bg-[#EC2300] text-white text-xs font-bold uppercase tracking-widest py-5 rounded-sm transition-all duration-300 shadow-lg shadow-[#EC2300]/20 hover:shadow-[#EC2300]/40 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed border-0"
              >
                {isSubmitting ? (
                  <>
                    Submitting Order…
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </>
                ) : isLoggedIn ? (
                  <>
                    Submit Wholesale Order
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Sign In to Submit Order
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Login prompt for guests trying to submit */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
