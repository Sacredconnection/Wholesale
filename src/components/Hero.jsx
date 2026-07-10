"use client";

import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function Hero({ onOpenApply }) {
  return (
    <div className="relative w-full min-h-screen bg-[#131313] overflow-hidden flex flex-col justify-center">
      {/* Full Bleed Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/banner/hero-banner.jpg" 
          alt="Misty Amazonian forest canopy at dawn" 
          className="w-full h-full object-cover object-center animate-fade-in"
        />
        {/* Radial & Linear Overlays for Premium Contrast and Typography Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#131313] via-[#131313]/75 to-[#131313]/20 opacity-95"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-80"></div>
        
        {/* Glow decoration */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#268072] opacity-[0.06] blur-[150px] pointer-events-none rounded-full animate-drift-slow"></div>
      </div>

      {/* Hero Section Content */}
      <section className="w-full py-16 md:py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col items-start gap-6 animate-fade-in-up w-full">
          
          <div className="inline-flex items-center gap-2 bg-[#268072]/15 border border-[#268072]/30 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-[#82d6c5] uppercase font-label-sm">
            <span className="w-1.5 h-1.5 bg-[#268072] rounded-full animate-pulse"></span>
            10 Authentic Tribes
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-none font-headline-lg max-w-3xl">
            The Power of <span className="text-[#82d6c5]">Ancestral Science</span> in Every Blend.
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 font-normal leading-relaxed max-w-2xl font-body-lg">
            Direct fair-trade distribution of sustainably harvested, premium sacred snuffs. 
            Engineered for global partners, botanical shops, and holistic distributors seeking absolute chemical purity and cultural authenticity.
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-4">
            <button 
              onClick={onOpenApply}
              className="bg-[#268072] hover:bg-[#1f665b] text-white text-sm font-bold tracking-wide px-10 py-5 rounded-sm shadow-lg shadow-[#268072]/10 hover:shadow-[#268072]/20 transition-all duration-300 flex items-center justify-center gap-3 group font-label-sm uppercase cursor-pointer border-0"
            >
              Apply for Wholesale Account
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}
