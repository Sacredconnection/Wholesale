"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";

export default function CatalogAccessGate({ children }) {
  const { isLoggedIn, loading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  if (!loading && isLoggedIn) return children;

  return (
    <div className="site-background-page flex min-h-screen flex-col bg-[#23403B] text-white">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        {loading ? <p role="status">Checking your account...</p> : <>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#82d6c5]">Wholesale access</p>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">Sign in to view our catalog</h1>
          <p className="mt-5 max-w-xl leading-7 text-white/70">Our products, wholesale prices and catalog downloads are available to signed-in customers with an approved trade account.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button type="button" onClick={() => setIsLoginOpen(true)} className="rounded-sm bg-[#268072] px-6 py-3 font-bold hover:bg-[#1f695e]">Client Login</button>
            <Link href="/register" className="rounded-sm border border-white/30 px-6 py-3 font-bold hover:bg-white/10">Apply for Trade Access</Link>
          </div>
        </>}
      </main>
      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
