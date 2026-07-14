"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const BANNERS = [
  {
    desktopSrc: "/banner/hero-banner.webp",
    mobileSrc: "/banner/hero-mobile/hero-banner-mobile.webp",
    alt: "Misty Amazonian forest canopy at dawn"
  },
  {
    desktopSrc: "/banner/hero-banner-01.webp",
    mobileSrc: "/banner/hero-mobile/hero-banner-01-mobile.webp",
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
    <div className="relative flex min-h-[calc(100svh-66px)] w-full flex-col justify-center overflow-hidden bg-[#23403B] md:min-h-screen">
      {/* Full Bleed Background Image Carousel */}
      <div className="absolute inset-0 z-0">
        {BANNERS.map((banner, idx) => (
          <picture
            key={banner.desktopSrc}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              activeIdx === idx ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <source media="(max-width: 767px)" srcSet={banner.mobileSrc} />
            <img
              src={banner.desktopSrc}
              alt={banner.alt}
              className="h-full w-full object-cover object-center"
            />
          </picture>
        ))}
        {/* Radial & Linear Overlays for Premium Contrast and Typography Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#131313]/95 via-[#131313]/55 to-[#131313]/10 md:bg-gradient-to-r md:from-[#131313] md:via-[#131313]/75 md:to-[#131313]/20 md:opacity-95"></div>
        <div className="absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-80 md:block"></div>
        
        {/* Glow decoration */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#268072] opacity-[0.06] blur-[150px] pointer-events-none rounded-full animate-drift-slow"></div>
      </div>

      {/* Hero Section Content */}
      <section className="relative z-10 w-full -translate-y-24 py-12 sm:py-16 md:translate-y-0 lg:py-24">
        <div className="mx-auto flex w-full max-w-7xl animate-fade-in-up flex-col items-center gap-4 px-4 text-center sm:gap-5 sm:px-6 md:items-start md:gap-6 md:text-left lg:px-8">
          
          <div className="inline-flex items-center gap-2 bg-[#268072]/15 border border-[#268072]/30 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-[#82d6c5] uppercase font-label-sm">
            <span className="w-1.5 h-1.5 bg-[#268072] rounded-full animate-pulse"></span>
            10 Authentic Tribes
          </div>
          
          <h1 className="max-w-xl text-[2rem] font-black leading-[1.02] tracking-tighter text-white sm:text-4xl md:max-w-3xl md:text-6xl md:leading-[0.98] lg:text-7xl font-headline-lg">
            The Power of <span className="text-[#82d6c5]">Ancestral Science</span> in Every Blend.
          </h1>
          
          <p className="max-w-md text-base font-normal leading-relaxed text-white/75 sm:text-lg md:max-w-2xl md:text-xl md:text-white/70 font-body-lg">
            Premium, sustainably harvested sacred snuffs for global retailers and holistic partners through direct fair-trade distribution.
          </p>
          
          <div className="hidden w-full max-w-sm flex-col items-stretch gap-4 pt-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center md:flex md:pt-4">
            <Link 
              href="/register"
              className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-sm font-bold tracking-wide px-7 sm:px-10 py-4 sm:py-5 rounded-sm shadow-lg shadow-[#EC2300]/10 hover:shadow-[#EC2300]/20 transition-all duration-300 flex items-center justify-center gap-3 group font-label-sm uppercase no-underline cursor-pointer border-0"
            >
              Register B2B Account
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

        </div>
      </section>

      {/* Mobile CTA anchored near the bottom to preserve the product area */}
      <div className="absolute inset-x-4 bottom-16 z-20 md:hidden">
        <Link
          href="/register"
          className="mx-auto flex w-full max-w-xs items-center justify-center gap-3 rounded-sm border-0 bg-[#EC2300] px-7 py-4 text-sm font-bold uppercase tracking-wide text-white no-underline shadow-lg shadow-[#EC2300]/10 transition-all duration-300 hover:bg-[#c51d00] hover:shadow-[#EC2300]/20 font-label-sm"
        >
          Register B2B Account
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

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
