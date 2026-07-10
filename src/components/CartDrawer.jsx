"use client";

import React, { useState } from 'react';
import { useCart } from './CartContext';
import { useAuth } from './AuthContext';
import { ShoppingBag, X, Minus, Plus, ArrowRight, Check } from 'lucide-react';

export default function CartDrawer() {
  const { isLoggedIn, user } = useAuth();
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

  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  if (!isCartOpen && !showOrderSuccess) return null;

  const handleCheckout = () => {
    clearCart();
    setIsCartOpen(false);
    setShowOrderSuccess(true);
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
            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-[#131313]">
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
            <div className="flex-grow overflow-y-auto px-8 py-6 flex flex-col gap-6 scrollbar-none">
              {cart.length > 0 ? (
                <div className="flex flex-col gap-5 divide-y divide-white/5">
                  {cart.map((item, index) => (
                    <div key={item.sku} className={`flex justify-between items-start gap-4 ${index > 0 ? "pt-5" : ""}`}>
                      <div className="flex-grow flex gap-3">
                        <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0 select-none">
                          {item.image || "🍃"}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold bg-[#268072]/10 text-[#82d6c5] border border-[#268072]/30 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                              {item.optionName}
                            </span>
                            <span className="text-[10px] font-mono text-white/35">
                              {item.sku}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between h-full gap-3 min-w-[100px] shrink-0">
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
            <div className="px-8 py-6 bg-[#131313] border-t border-white/10 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-white/50 uppercase tracking-wider font-label-sm">
                  <span>Total Items</span>
                  <span className="font-bold text-white font-mono">{cartTotalItems}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-white/50 font-mono">
                  <span>EST. WEIGHT</span>
                  <span className="font-bold text-white font-mono">
                    {cartTotalWeightGrams >= 1000 
                      ? `${(cartTotalWeightGrams / 1000).toFixed(2)} kg`
                      : `${cartTotalWeightGrams} g`
                    }
                  </span>
                </div>
                
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

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-[#268072] hover:bg-[#1f665b] disabled:opacity-40 disabled:hover:bg-[#268072] text-white text-xs font-bold uppercase tracking-widest py-5 rounded-sm transition-all duration-300 shadow-lg shadow-[#268072]/20 hover:shadow-[#268072]/40 flex items-center justify-center gap-3 cursor-pointer disabled:cursor-not-allowed border-0"
              >
                Submit Wholesale Order
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Success Notification Modal */}
      {showOrderSuccess && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#1a1a1a] border border-white/10 rounded-md max-w-md w-full p-8 text-center shadow-2xl relative animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-[#268072]/20 border border-[#268072]/45 flex items-center justify-center text-3xl mx-auto mb-6">
              <Check className="w-8 h-8 text-[#82d6c5]" />
            </div>
            
            <h3 className="font-headline-md text-2xl font-bold text-white mb-2">
              Order Draft Submitted
            </h3>
            
            <p className="font-body-md text-sm text-white/70 leading-relaxed mb-6">
              Your wholesale order request has been received. Our vetting team will check product availability, calculate shipping weight costs, and contact you within 24 hours to confirm.
            </p>

            <button 
              onClick={() => setShowOrderSuccess(false)}
              className="bg-[#268072] text-white font-label-sm text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-sm hover:bg-[#1f665b] transition-all duration-300 cursor-pointer border-0 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
