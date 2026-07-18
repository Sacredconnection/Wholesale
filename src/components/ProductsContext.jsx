"use client";

// Provides the product catalog to client components. Products come exclusively
// from the WooCommerce API (/api/products) — nothing is pre-loaded, so the UI
// must render a loading state until the fetch resolves.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthContext";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return () => {};
    if (!isLoggedIn) {
      const clearTimer = window.setTimeout(() => {
        setProducts([]);
        setError("");
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }

    async function loadCatalog() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/products", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Catalog API responded ${res.status}`);
        if (!cancelled) setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setError(err.message || "Could not load the catalog.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isLoggedIn, reloadKey]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, reload }}>
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
