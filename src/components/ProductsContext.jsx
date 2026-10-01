"use client";

// Preloads the public catalog and upgrades it with partner pricing after login.

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
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
  const productRequests = useRef(new Map());

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const resolveProduct = useCallback(async (product) => {
    const hasCorrectPricing =
      !isLoggedIn || product?.pricingVisible === true;
    if (!product || (product.optionsLoaded && hasCorrectPricing)) return product;
    const requestKey = `${isLoggedIn ? "partner" : "public"}:${product.id}`;
    if (productRequests.current.has(requestKey)) {
      return productRequests.current.get(requestKey);
    }

    const request = (async () => {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) invalidateSession();
          throw new Error(data.error || "Could not load product options.");
        }
        setProducts((currentProducts) =>
          currentProducts.map((entry) => (entry.id === data.product.id ? data.product : entry))
        );
        return data.product;
      } catch (loadError) {
        if (loadError.name === "TimeoutError") {
          throw new Error("The product options took too long to load. Please try again.");
        }
        throw loadError;
      } finally {
        productRequests.current.delete(requestKey);
      }
    })();

    productRequests.current.set(requestKey, request);
    return request;
  }, [invalidateSession, isLoggedIn]);

  useEffect(() => {
    let cancelled = false;

    if (authLoading) return () => {};
    async function loadCatalog() {
      setLoading(true);
      setProducts([]);
      setError("");
      setWarning("");
      productRequests.current.clear();

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
    <ProductsContext.Provider value={{ products, loading, error, warning, reload, resolveProduct }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts must be used within a ProductsProvider");
  return context;
}
