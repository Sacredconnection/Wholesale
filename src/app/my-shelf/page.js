"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, LoaderCircle, Trash2 } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useProducts } from "@/components/ProductsContext";
import { useShelf } from "@/components/ShelfContext";
import { shelfProductId } from "@/lib/shelf";
import { compareCatalogProducts } from "@/lib/catalog-taxonomy";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ShelfButton from "@/components/ShelfButton";
import ProductPurchaseControls from "@/components/ProductPurchaseControls";

export default function MyShelfPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, error: productsError, reload: reloadProducts } = useProducts();
  const { productIds, loading, saving, error, reload, setSaved } = useShelf();
  const [loginOpen, setLoginOpen] = useState(false);
  const saved = products.filter((product) => productIds.includes(shelfProductId(product))).sort(compareCatalogProducts);
  const missing = productsLoading || productsError ? [] : productIds.filter((id) => !products.some((product) => shelfProductId(product) === id));
  return <div className="site-background-page flex min-h-screen flex-col bg-[#23403B] text-white"><Header onOpenLogin={() => setLoginOpen(true)}/><main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-32">
    <Bookmark className="mb-4 text-[#82d6c5]" size={30}/><h1 className="text-4xl font-bold">My Shelf</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">Your personal collection of preferred varieties. Use the bookmark button in the catalog to save a product to your account, then return here to choose sizes and order again. Saving a variety does not reserve stock.</p>
    {authLoading || (isLoggedIn && (loading || productsLoading)) ? <p role="status" className="mt-10 flex gap-2 text-white/60"><LoaderCircle className="animate-spin" size={20}/>Loading your collection…</p> : !isLoggedIn ? <button type="button" onClick={() => setLoginOpen(true)} className="mt-8 rounded bg-[#82d6c5] px-5 py-3 font-bold text-[#102c27]">Sign in to My Shelf</button> : <>
      {(error || productsError) && <p role="alert" className="mt-6 rounded border border-red-300/30 p-4 text-sm text-red-100">{error || productsError}<button type="button" onClick={() => { reload(); reloadProducts(); }} className="ml-3 underline">Try again</button></p>}
      <div className="my-7 flex flex-wrap justify-between gap-3 text-sm"><span className="text-white/55">{productIds.length} saved varieties{user?.firstName ? ` for ${user.firstName}` : ""}</span><Link href="/catalog" className="text-[#82d6c5] underline">Explore the catalog</Link></div>
      {!productIds.length && !error && <p className="rounded border border-white/15 p-8 text-white/60">Your shelf is empty. Save a few favorites from the catalog to build your collection.</p>}
      <div className="grid gap-5 md:grid-cols-2">{saved.map((product) => <article key={product.id} className="rounded border border-white/15 bg-[#102c27]/70 p-5"><p className="text-xs text-[#82d6c5]">{product.tribe || product.category}</p><h2 className="mb-4 mt-1 text-lg font-semibold"><Link href={product.productUrl || `/product/${product.id}`}>{product.name}</Link></h2><div className="mb-4"><ShelfButton product={product}/></div><ProductPurchaseControls product={product}/></article>)}</div>
      {missing.length > 0 && <section className="mt-8 rounded border border-white/15 p-5"><h2 className="font-semibold">Currently unavailable in the catalog</h2><p className="mt-2 text-sm text-white/55">These saved references are retained in your account. They may have been retired or temporarily removed.</p>{missing.map((id) => <div key={id} className="mt-3 flex items-center justify-between text-sm text-white/60"><span>Product reference #{id}</span><button type="button" disabled={saving} onClick={() => setSaved(id, false)} className="flex items-center gap-1 text-[#82d6c5] disabled:opacity-40"><Trash2 size={14}/>Remove from shelf</button></div>)}</section>}
    </>}
  </main><Footer/><LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)}/></div>;
}
