"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import WholesaleFormats from '@/components/WholesaleFormats';
import LineageShowcase from '@/components/LineageShowcase';
import Onboarding from '@/components/Onboarding';
import NGOSection from '@/components/NGOSection';
import RetailRedirectSection from '@/components/RetailRedirectSection';
import MayaWholesaleBanner from '@/components/MayaWholesaleBanner';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';
import SuggestedBlends from '@/components/SuggestedBlends';

export default function HomeClient() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isLoggedIn, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !isLoggedIn || window.location.hash !== "#suggested-blends") {
      return undefined;
    }
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("suggested-blends")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [authLoading, isLoggedIn]);

  return (
    <div id="top" className="site-background-page home-no-glass bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Hero Visual Section */}
      <Hero />

      {/* Trust & Verification Bar */}
      <TrustBar />

      {/* Main Page Area */}
      <main className="flex-grow w-full bg-[#23403B] pb-12 sm:pb-14 lg:pb-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 pb-10 pt-10 sm:gap-12 sm:px-6 sm:pb-12 sm:pt-12 lg:px-8">
          {!authLoading && isLoggedIn && (
            <section id="suggested-blends" className="scroll-mt-28">
              <SuggestedBlends />
            </section>
          )}

          {/* B2B Onboarding Steps */}
          <Onboarding />

          {/* Tribe Lineage Details */}
          <LineageShowcase />

          {/* Product volumes and packaging formats */}
          <WholesaleFormats />

        </div>

        {/* Secondary path for individual retail customers */}
        <RetailRedirectSection />

        <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 sm:pt-12 lg:px-8">
          {/* NGO Partnership Details */}
          <NGOSection />
        </div>
      </main>

      {/* Maya Herbs partner promotion */}
      <MayaWholesaleBanner />

      {/* Footer Details */}
      <Footer />

      {/* Client Dashboard / Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
