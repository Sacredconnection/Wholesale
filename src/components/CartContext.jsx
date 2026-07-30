"use client";

import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  cartUnitPrice,
  normalizeQuantityForWeight,
  optionPriceForUser,
  quantityStepForWeight,
} from '@/lib/pricing';

const CartContext = createContext();
const SACRED_STORE_ID = "sacred-connection";

export function CartProvider({ children }) {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartHydrated = useRef(false);
  const [isCartHydrated, setIsCartHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      try {
        const storedCart = localStorage.getItem('sc_wholesale_cart');
        const parsedCart = storedCart ? JSON.parse(storedCart) : [];
        setCart(
          Array.isArray(parsedCart)
            ? parsedCart
                .filter(
                  (item) =>
                    !item.storeId || item.storeId === SACRED_STORE_ID
                )
                .map((item) => {
                  const quantityStep = quantityStepForWeight(item.weightGrams);
                  return {
                    ...item,
                    storeId: SACRED_STORE_ID,
                    storeName: "Sacred Connection",
                    cartKey:
                      item.cartKey ||
                      `${SACRED_STORE_ID}:${item.sku}`,
                    quantityStep,
                    quantity: normalizeQuantityForWeight(
                      item.quantity,
                      item.weightGrams
                    ),
                  };
                })
            : []
        );
      } catch (e) {
        console.error("Failed to load cart from localStorage", e);
        setCart([]);
      } finally {
        cartHydrated.current = true;
        setIsCartHydrated(true);
      }
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!cartHydrated.current) return;
    localStorage.setItem('sc_wholesale_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (authLoading || isLoggedIn || !isCartHydrated) return;
    const clearTimer = window.setTimeout(() => {
      setCart([]);
      setIsCartOpen(false);
      localStorage.removeItem("sc_wholesale_cart");
    }, 0);
    return () => window.clearTimeout(clearTimer);
  }, [authLoading, isCartHydrated, isLoggedIn]);

  const cartItemFromSelection = (product, optionIndex, quantity) => {
    if (
      !product ||
      !Number.isInteger(optionIndex) ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      return null;
    }
    const selectedOption = product.options?.[optionIndex];
    if (!selectedOption) return null;
    const quantityStep = quantityStepForWeight(selectedOption.weightGrams);
    const storeId = product.storeId || SACRED_STORE_ID;
    if (storeId !== SACRED_STORE_ID) return null;

    return {
      id: product.id,
      cartKey: `${storeId}:${selectedOption.sku}`,
      storeId,
      storeName: product.storeName || "Sacred Connection",
      name: product.name,
      sku: selectedOption.sku,
      optionName: selectedOption.name,
      category: product.category || "",
      price: optionPriceForUser(selectedOption, user, product.category),
      weightGrams: selectedOption.weightGrams,
      quantityStep,
      quantity: normalizeQuantityForWeight(
        quantity,
        selectedOption.weightGrams
      ),
      image: product.image,
      wcProductId: product.wcId || null,
      wcVariationId: selectedOption.wcVariationId || null,
      inStock: selectedOption.inStock !== false,
    };
  };

  const addSelectionsToCart = (selections) => {
    const incomingItems = (Array.isArray(selections) ? selections : [])
      .map(({ product, optionIndex, quantity = 1 }) =>
        cartItemFromSelection(product, optionIndex, Number(quantity))
      )
      .filter(Boolean);
    if (incomingItems.length === 0) return 0;

    setCart((prevCart) => {
      const nextCart = prevCart.map((item) => ({ ...item }));
      for (const incoming of incomingItems) {
        const existingItem = nextCart.find((item) => item.cartKey === incoming.cartKey);
        if (existingItem) {
          existingItem.quantity += incoming.quantity;
          existingItem.inStock = incoming.inStock;
        } else {
          nextCart.push(incoming);
        }
      }
      return nextCart;
    });

    return incomingItems.length;
  };

  // Add to cart helper
  const addToCart = (product, optionIndex, quantity = 1) =>
    addSelectionsToCart([{ product, optionIndex, quantity }]);

  // Update item quantity
  const updateQuantity = (cartKey, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.cartKey === cartKey) {
            const quantityStep =
              item.quantityStep || quantityStepForWeight(item.weightGrams);
            const direction = change < 0 ? -1 : 1;
            const nextQty = item.quantity + direction * quantityStep;
            return {
              ...item,
              quantityStep,
              quantity: Math.max(quantityStep, nextQty),
            };
          }
          return item;
        })
    );
  };

  // Remove item from cart
  const removeFromCart = (cartKey) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartKey !== cartKey));
  };

  // Clear entire cart
  const clearCart = () => {
    setCart([]);
  };

  const removeItemsByStore = (storeIds) => {
    const selectedStores = new Set(storeIds);
    setCart((prevCart) => prevCart.filter((item) => !selectedStores.has(item.storeId)));
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
      addSelectionsToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      removeItemsByStore,
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
