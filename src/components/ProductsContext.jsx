"use client";

// Provides the product catalog to client components. Starts with the static
// dataset (src/data/products.js) so the UI renders instantly, then swaps in
// live WooCommerce data from /api/products once it responds. If the backend
// is unconfigured or unreachable, the static catalog stays in place.

import React, { createContext, useContext, useState, useEffect } from "react";
import { PRODUCTS_DATA } from "@/data/products";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(PRODUCTS_DATA);
  const [source, setSource] = useState("static");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveCatalog() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error(`API responded ${res.status}`);
        const { products: liveProducts } = await res.json();
        if (!cancelled && Array.isArray(liveProducts) && liveProducts.length > 0) {
          setProducts(liveProducts);
          setSource("woocommerce");
        }
      } catch (err) {
        console.info(`Using static catalog (WooCommerce unavailable: ${err.message})`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLiveCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ProductsContext.Provider value={{ products, source, loading }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductsProvider");
  }
  return context;
}
