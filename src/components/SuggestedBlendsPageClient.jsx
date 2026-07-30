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
            Stock-aware assortments
          </span>
          <h1 className="mt-3 font-headline-lg text-3xl font-black tracking-tight text-white sm:text-4xl">
            Suggested wholesale blends
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/65 sm:text-base">
            Browse curated order templates such as Yawanawá Lineage, Mixed
            Indigenous Nations, Tobacco-Free Discovery, and balanced counter
            assortments. Every selectable list is rebuilt against current
            inventory before it reaches your order sheet.
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
