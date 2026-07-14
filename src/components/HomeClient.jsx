"use client";

import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import LineageShowcase from '@/components/LineageShowcase';
import TestimonialSection from '@/components/TestimonialSection';
import Onboarding from '@/components/Onboarding';
import NGOSection from '@/components/NGOSection';
import RetailRedirectSection from '@/components/RetailRedirectSection';
import Footer from '@/components/Footer';
import LoginModal from '@/components/LoginModal';

export default function HomeClient() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div id="top" className="bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header onOpenLogin={() => setIsLoginOpen(true)} />

      {/* Hero Visual Section */}
      <Hero />

      {/* Trust & Verification Bar */}
      <TrustBar />

      {/* Main Page Area */}
      <main className="flex-grow w-full bg-[#23403B] pb-12 sm:pb-14 lg:pb-16">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-12 sm:gap-14 sm:px-6 sm:pb-14 lg:gap-16 lg:px-8 lg:pb-16">
          {/* B2B Onboarding Steps */}
          <Onboarding />

          {/* Tribe Lineage Details */}
          <LineageShowcase />

          {/* Retail Partner Testimonial */}
          <TestimonialSection />

          {/* NGO Partnership Details */}
          <NGOSection />
        </div>

        {/* Secondary path for individual retail customers */}
        <RetailRedirectSection />
      </main>

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
