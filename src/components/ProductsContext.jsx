"use client";

// Preloads the Sacred Connection catalog as soon as authentication is restored.
// Keeping this provider above the pages lets /catalog reuse the loaded data.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthContext";

const ProductsContext = createContext(null);
const CLIENT_CATALOG_TIMEOUT_MS = 35000;

export function ProductsProvider({ children }) {
  const { isLoggedIn, loading: authLoading, invalidateSession } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return () => {};
    if (!isLoggedIn) {
      const clearTimer = window.setTimeout(() => {
        setProducts([]);
        setError("");
        setWarning("");
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }

    async function loadCatalog() {
      setLoading(true);
      setError("");
      setWarning("");

      try {
        const response = await fetch("/api/products", {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(CLIENT_CATALOG_TIMEOUT_MS),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) {
            invalidateSession();
            return;
          }
          throw new Error(data.error || "Could not load the Sacred Connection catalog.");
        }
        if (!cancelled) {
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (catalogError) {
        if (!cancelled) {
          setProducts([]);
          setError(
            catalogError.name === "TimeoutError"
              ? "The Sacred Connection catalog took too long to load. Please try again."
              : catalogError.message
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [authLoading, invalidateSession, isLoggedIn, reloadKey]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, warning, reload }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts must be used within a ProductsProvider");
  return context;
}
