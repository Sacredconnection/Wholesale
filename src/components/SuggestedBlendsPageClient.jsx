"use client";

import { useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LoginModal from "@/components/LoginModal";
import SuggestedBlends from "@/components/SuggestedBlends";

export default function SuggestedBlendsPageClient() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div
      id="top"
      className="site-background-page flex min-h-screen flex-col bg-[#23403B] text-[#e5e2e1]"
    >
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <header className="mb-8 max-w-3xl">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#82d6c5]">
            From your previous orders
          </span>
          <h1 className="mt-3 font-headline-lg text-3xl font-black tracking-tight text-white sm:text-4xl">
            Your product suggestions
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
            Suggestions appear when your account has processing or completed
            orders with products still in the catalog. We use your purchase
            history and current stock to help you restock and explore related
            products. Review sizes and quantities before adding an assortment.
          </p>
        </header>
        <SuggestedBlends onRequireLogin={() => setIsLoginOpen(true)} />
      </main>
      <Footer />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}
