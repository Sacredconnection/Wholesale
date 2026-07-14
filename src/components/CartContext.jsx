"use client";

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { optionPriceForUser, cartUnitPrice } from '@/lib/pricing';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isLoggedIn, user } = useAuth();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('sc_wholesale_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to load cart from localStorage", e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sc_wholesale_cart', JSON.stringify(cart));
  }, [cart]);

  // Add to cart helper
  const addToCart = (product, optionIndex, quantity = 1) => {
    if (quantity <= 0) return;
    const selectedOption = product.options[optionIndex];
    if (!selectedOption) return;

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.sku === selectedOption.sku);
      
      if (existingItemIndex > -1) {
        // Update existing item quantity immutably
        return prevCart.map((item, idx) => {
          if (idx === existingItemIndex) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {
        // Add new item
        return [
          ...prevCart,
          {
            id: product.id,
            name: product.name,
            sku: selectedOption.sku,
            optionName: selectedOption.name,
            // Category picks the progressive tier table (indigenous/shamanic)
            category: product.category || "",
            // Price for the buyer's access level (role-based pricing)
            price: optionPriceForUser(selectedOption, user, product.category),
            weightGrams: selectedOption.weightGrams,
            quantity: quantity,
            image: product.image,
            // WooCommerce ids (present when the item came from the live
            // catalog) — used to register the order via /api/orders.
            wcProductId: product.wcId || null,
            wcVariationId: selectedOption.wcVariationId || null
          }
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (sku, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.sku === sku) {
            const nextQty = item.quantity + change;
            return { ...item, quantity: Math.max(1, nextQty) };
          }
          return item;
        })
    );
  };

  // Remove item from cart
  const removeFromCart = (sku) => {
    setCart((prevCart) => prevCart.filter((item) => item.sku !== sku));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  const cartTotalItems = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const cartTotalWeightGrams = useMemo(() => {
    return cart.reduce((total, item) => total + (item.weightGrams || 0) * item.quantity, 0);
  }, [cart]);

  // Effective prices: New Customer items are re-rated by the total order
  // weight tier (progressive per-gram pricing); other levels keep the price
  // captured when the item was added.
  const pricedCart = useMemo(() => {
    return cart.map((item) => ({
      ...item,
      price: cartUnitPrice(item, user, cartTotalWeightGrams),
    }));
  }, [cart, user, cartTotalWeightGrams]);

  const cartSubtotal = useMemo(() => {
    return pricedCart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [pricedCart]);

  return (
    <CartContext.Provider value={{
      cart: pricedCart,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      cartSubtotal,
      cartTotalItems,
      cartTotalWeightGrams
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
