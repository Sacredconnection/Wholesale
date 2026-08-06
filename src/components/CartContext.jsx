"use client";

import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductsContext';
import {
  cartUnitPrice,
  maximumOrderQuantityForWeight,
  needsBackorder,
  normalizeQuantityForWeight,
  optionPriceForUser,
  quantityStepForWeight,
} from '@/lib/pricing';

const CartContext = createContext();
const SACRED_STORE_ID = "sacred-connection";

export function CartProvider({ children }) {
  const { isLoggedIn, user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading } = useProducts();
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

  // Reconcile persisted cart availability with the freshly loaded catalog.
  // This prevents an old localStorage snapshot from hiding a recent restock
  // or showing a stale warning after stock changes in WooCommerce.
  useEffect(() => {
    if (!isCartHydrated || productsLoading || products.length === 0) return;

    const liveOptions = new Map();
    products.forEach((product) => {
      (product.options || []).forEach((option) => {
        const sku = String(option.sku || "").toLowerCase();
        if (!sku) return;
        liveOptions.set(
          `${product.storeId || SACRED_STORE_ID}:${sku}`,
          { product, option }
        );
      });
    });

    const reconcileTimer = window.setTimeout(() => {
      setCart((currentCart) => {
        let changed = false;
        const nextCart = currentCart.map((item) => {
          const live = liveOptions.get(
            `${item.storeId || SACRED_STORE_ID}:${String(item.sku || "").toLowerCase()}`
          );
          if (!live) return item;

          const nextAvailability = {
            inStock: live.option.inStock !== false,
            stockQuantity: live.option.stockQuantity ?? null,
            backordersAllowed: live.option.backordersAllowed === true,
            wcProductId: live.product.wcId || item.wcProductId || null,
            wcVariationId: live.option.wcVariationId || null,
          };
          if (
            item.inStock === nextAvailability.inStock &&
            item.stockQuantity === nextAvailability.stockQuantity &&
            item.backordersAllowed === nextAvailability.backordersAllowed &&
            item.wcProductId === nextAvailability.wcProductId &&
            item.wcVariationId === nextAvailability.wcVariationId
          ) {
            return item;
          }
          changed = true;
          return { ...item, ...nextAvailability };
        });

        return changed ? nextCart : currentCart;
      });
    }, 0);

    return () => window.clearTimeout(reconcileTimer);
  }, [isCartHydrated, products, productsLoading]);

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
    const maximumQuantity = maximumOrderQuantityForWeight(selectedOption.weightGrams);
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
      quantity: Math.min(
        maximumQuantity,
        normalizeQuantityForWeight(quantity, selectedOption.weightGrams)
      ),
      image: product.image,
      wcProductId: product.wcId || null,
      wcVariationId: selectedOption.wcVariationId || null,
      inStock: selectedOption.inStock !== false,
      stockQuantity: selectedOption.stockQuantity ?? null,
      backordersAllowed: selectedOption.backordersAllowed === true,
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
          existingItem.quantity = Math.min(
            existingItem.quantity,
            maximumOrderQuantityForWeight(incoming.weightGrams)
          );
          existingItem.inStock = incoming.inStock;
          existingItem.stockQuantity = incoming.stockQuantity;
          existingItem.backordersAllowed = incoming.backordersAllowed;
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

  const replaceCartWithSelections = (selections) => {
    const incomingItems = (Array.isArray(selections) ? selections : [])
      .map(({ product, optionIndex, quantity = 1 }) =>
        cartItemFromSelection(product, optionIndex, Number(quantity))
      )
      .filter(Boolean);
    if (incomingItems.length === 0) return 0;

    setCart(incomingItems);
    return incomingItems.length;
  };

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
            const maximumQuantity = maximumOrderQuantityForWeight(item.weightGrams);
            return {
              ...item,
              quantityStep,
              quantity: Math.min(
                maximumQuantity,
                Math.max(quantityStep, nextQty)
              ),
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
      needsBackorder: needsBackorder(item),
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
      replaceCartWithSelections,
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
