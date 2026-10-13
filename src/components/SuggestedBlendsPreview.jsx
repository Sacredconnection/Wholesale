"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, History } from "lucide-react";
import { useProducts } from "@/components/ProductsContext";
import { useAuth } from "@/components/AuthContext";
import { findCatalogProduct, rankHistoricalItems } from "@/lib/order-suggestions";

export default function SuggestedBlendsPreview() {
  const { products } = useProducts();
  const { isLoggedIn, user } = useAuth();
  const [history, setHistory] = useState(null);
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    fetch("/api/orders", { credentials: "same-origin", cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : null)
      .then((data) => { if (active) setHistory({ account: user?.email, orders: data?.orders || [] }); })
      .catch(() => { if (active) setHistory({ account: user?.email, orders: [] }); });
    return () => { active = false; };
  }, [isLoggedIn, user?.email]);
  const examples = useMemo(() => {
    if (!isLoggedIn || history?.account !== user?.email) return [];
    const seen = new Set();
    return rankHistoricalItems(history?.orders).flatMap((item) => {
      const product = findCatalogProduct(products, item, item.storeId);
      if (!product || product.inStock === false || product.catalogVisible === false || seen.has(product.id)) return [];
      seen.add(product.id);
      return [product];
    }).slice(0, 3);
  }, [history, isLoggedIn, products, user?.email]);
  if (!examples.length) return null;
  return <section id="suggested-blends" className="rounded-xl border border-[#82d6c5]/25 bg-[#102c27] p-6 md:p-8">
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#82d6c5]"><History className="h-4 w-4" aria-hidden="true" />Based on your order history</p>
    <h2 className="mt-3 text-2xl font-bold text-white">Restock products you have ordered before</h2>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">Your recent completed and processing orders help us suggest products and related groups. Available sizes and quantities are checked before you add them to your cart.</p>
    <ul className="mt-4 flex flex-wrap gap-2">{examples.map((product) => <li key={product.id} className="rounded-sm border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/75">{product.name}</li>)}</ul>
    <Link href="/suggested-blends" className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#EC2300] px-5 py-3 text-xs font-bold uppercase text-white hover:bg-[#c51d00]">View your suggestions<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
  </section>;
}
