"use client";

import React, { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustBar from '@/components/TrustBar';
import LineageShowcase from '@/components/LineageShowcase';
import Onboarding from '@/components/Onboarding';
import NGOSection from '@/components/NGOSection';
import Footer from '@/components/Footer';
import ApplicationModal from '@/components/ApplicationModal';
import LoginModal from '@/components/LoginModal';

export default function HomeClient() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  return (
    <div className="bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      {/* Navigation Header */}
      <Header 
        onOpenLogin={() => setIsLoginOpen(true)} 
        onOpenApply={() => setIsApplyOpen(true)} 
      />

      {/* Hero Visual Section */}
      <Hero onOpenApply={() => setIsApplyOpen(true)} />

      {/* Trust & Verification Bar */}
      <TrustBar onOpenApply={() => setIsApplyOpen(true)} />

      {/* Main Page Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-24 bg-[#23403B]">
        {/* B2B Onboarding Steps */}
        <Onboarding onOpenApply={() => setIsApplyOpen(true)} />

        {/* Tribe Lineage Details */}
        <LineageShowcase />

        {/* NGO Partnership Details */}
        <NGOSection />
      </main>

      {/* Footer Details */}
      <Footer />

      {/* Vetting Application Modal Form */}
      <ApplicationModal 
        isOpen={isApplyOpen} 
        onClose={() => setIsApplyOpen(false)} 
      />

      {/* Client Dashboard / Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
