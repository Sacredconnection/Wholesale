"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const BANNERS = [
  {
    src: "/banner/hero-banner.jpg",
    alt: "Misty Amazonian forest canopy at dawn"
  },
  {
    src: "/banner/hero-banner-01.jpg",
    alt: "Sacred medicines and tribal forest scenery"
  }
];

export default function Hero({ onOpenApply }) {
  const [activeIdx, setActiveIdx] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#23403B] overflow-hidden flex flex-col justify-center">
      {/* Full Bleed Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {BANNERS.map((banner, idx) => (
          <img 
            key={banner.src}
            src={banner.src} 
            alt={banner.alt} 
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
              activeIdx === idx ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
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
            <Link 
              href="/register"
              className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-sm font-bold tracking-wide px-10 py-5 rounded-sm shadow-lg shadow-[#EC2300]/10 hover:shadow-[#EC2300]/20 transition-all duration-300 flex items-center justify-center gap-3 group font-label-sm uppercase no-underline cursor-pointer border-0"
            >
              Register B2B Account
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* Carousel dots indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer border-0 p-0 ${
              activeIdx === idx ? 'bg-[#82d6c5] w-6' : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
