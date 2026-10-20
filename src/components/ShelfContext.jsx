"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { shelfProductId } from "@/lib/shelf";

const ShelfContext = createContext(null);

export function ShelfProvider({ children }) {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [productIds, setProductIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const identity = `${user?.id || ""}:${user?.email || ""}`;
  const currentIdentity = useRef(identity);
  const busy = useRef(false);
  const reload = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => { currentIdentity.current = identity; }, [identity]);
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    async function load() {
      setProductIds([]);
      setError("");
      if (!isLoggedIn) { setLoading(false); return; }
      setLoading(true);
      try {
        const response = await fetch("/api/account/shelf", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Your shelf could not be loaded.");
        if (!controller.signal.aborted) setProductIds(data.productIds || []);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [authLoading, isLoggedIn, identity, revision]);

  const setSaved = async (productId, saved) => {
    if (!isLoggedIn || busy.current || loading) return;
    busy.current = true;
    setSaving(true);
    setError("");
    const owner = identity;
    try {
      const response = await fetch("/api/account/shelf", { method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, saved }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Your shelf could not be updated.");
      if (currentIdentity.current === owner) setProductIds(data.productIds || []);
    } catch (failure) {
      if (currentIdentity.current === owner) setError(failure.message);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return <ShelfContext.Provider value={{ productIds, loading, saving, error, reload, setSaved, isSaved: (product) => productIds.includes(shelfProductId(product)), toggle: (product) => {
    const id = shelfProductId(product);
    if (id) return setSaved(id, !productIds.includes(id));
  } }}>{children}</ShelfContext.Provider>;
}

export function useShelf() {
  const value = useContext(ShelfContext);
  if (!value) throw new Error("useShelf must be used within ShelfProvider");
  return value;
}
