"use client";

// Loads each WooCommerce catalog independently. The first store to respond is
// rendered immediately; a slow or unavailable secondary store cannot keep the
// entire catalog behind a spinner.

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthContext";

const ProductsContext = createContext(null);
const CATALOG_STORES = ["sacred-connection", "maya-herbs"];
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

    async function loadStore(storeId) {
      const response = await fetch(`/api/products?store=${encodeURIComponent(storeId)}`, {
        credentials: "same-origin",
        cache: "no-store",
        signal: AbortSignal.timeout(CLIENT_CATALOG_TIMEOUT_MS),
      });
      let data = {};
      try {
        data = await response.json();
      } catch {
        // The status and store id still provide an actionable error below.
      }
      if (!response.ok) {
        const error = new Error(data.error || `${storeId} catalog responded ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return Array.isArray(data.products) ? data.products : [];
    }

    async function loadCatalog() {
      setLoading(true);
      setError("");
      setWarning("");
      let successfulStores = 0;
      const failures = [];

      await Promise.allSettled(
        CATALOG_STORES.map(async (storeId) => {
          try {
            const storeProducts = await loadStore(storeId);
            if (cancelled) return;
            successfulStores += 1;
            setProducts((currentProducts) =>
              [
                ...currentProducts.filter((product) => product.storeId !== storeId),
                ...storeProducts,
              ].sort((a, b) => a.name.localeCompare(b.name))
            );
            // Render as soon as either store is ready.
            setLoading(false);
          } catch (storeError) {
            failures.push({ storeId, error: storeError });
          }
        })
      );

      if (cancelled) return;
      if (successfulStores === 0) {
        setProducts([]);
        const unauthorized = failures.some(({ error: storeError }) => storeError.status === 401);
        if (unauthorized) {
          invalidateSession();
          return;
        }
        setError(failures[0]?.error?.message || "Could not load the catalog.");
      } else if (failures.length > 0) {
        console.error("Some catalog stores could not be loaded:", failures);
        setWarning(
          failures.map(({ error: storeError }) => storeError.message).join(" ")
        );
      }
      setLoading(false);
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
