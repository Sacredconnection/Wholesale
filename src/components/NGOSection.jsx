"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Leaf, Shield, Droplets } from 'lucide-react';

export default function NGOSection() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [logoSrc, setLogoSrc] = useState('/ngo/logo-conexao-ancestral.svg');
  const [logoFormatIndex, setLogoFormatIndex] = useState(0);
  const logoFormats = [
    '/ngo/logo-conexao-ancestral.svg',
    '/ngo/logo-conexao-ancestral.png',
    '/ngo/logo-conexao-ancestral.jpg',
    '/ngo/logo-conexao-ancestral.jpeg'
  ];

  const handleLogoError = (e) => {
    if (logoFormatIndex < logoFormats.length - 1) {
      const nextIndex = logoFormatIndex + 1;
      setLogoFormatIndex(nextIndex);
      setLogoSrc(logoFormats[nextIndex]);
    } else {
      e.target.style.display = 'none';
      const fallback = e.target.nextSibling;
      if (fallback) fallback.style.display = 'inline-flex';
    }
  };

  const [symbolSrc, setSymbolSrc] = useState('/ngo/simbolo-conexao-ancestral.svg');
  const [symbolFormatIndex, setSymbolFormatIndex] = useState(0);
  const symbolFormats = [
    '/ngo/simbolo-conexao-ancestral.svg',
    '/ngo/simbolo-conexao-ancestral.png',
    '/ngo/simbolo-conexao-ancestral.jpg',
  ];

  const handleSymbolError = (e) => {
    if (symbolFormatIndex < symbolFormats.length - 1) {
      const nextIndex = symbolFormatIndex + 1;
      setSymbolFormatIndex(nextIndex);
      setSymbolSrc(symbolFormats[nextIndex]);
    } else {
      e.target.style.display = 'none';
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes ngoFadeUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ngo-animate-item {
          opacity: 0;
          transform: translateY(40px);
        }
        .ngo-animate-item.animate {
          animation: ngoFadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>

      <section
        ref={sectionRef}
        id="ngo-partnership"
        className="bg-[#1a1a1a] border border-[#268072]/35 rounded-2xl p-8 md:p-16 relative overflow-hidden scroll-mt-24 w-full shadow-2xl shadow-[#268072]/5 hover:border-[#268072]/60 transition-colors duration-500"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-36 -left-36 w-[500px] h-[500px] bg-[#268072] opacity-[0.09] blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-36 -right-36 w-[500px] h-[500px] bg-[#82d6c5] opacity-[0.07] blur-[130px] pointer-events-none rounded-full" />

        {/* NGO Symbol Watermark in Bottom-Right */}
        <img 
          src={symbolSrc} 
          alt="" 
          className="absolute bottom-[-160px] right-[-120px] w-[500px] h-[500px] md:w-[650px] md:h-[650px] lg:w-[750px] lg:h-[750px] opacity-[0.035] pointer-events-none select-none z-0 mix-blend-screen"
          onError={handleSymbolError}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10 relative">
          
          {/* Left Column: Copywriting & Pillars */}
          <div 
            className={`lg:col-span-7 flex flex-col gap-8 ngo-animate-item ${visible ? 'animate' : ''}`}
            style={visible ? { animationDelay: '0.1s' } : {}}
          >
            {/* NGO Logo with text fallback */}
            <div className="h-16 md:h-[80px] flex items-center mb-6">
              <img 
                src={logoSrc} 
                alt="Conexão Ancestral Logo" 
                className="h-16 md:h-[80px] w-auto object-contain opacity-95 hover:opacity-100 transition-all duration-300"
                onError={handleLogoError}
              />
              <span className="hidden items-center gap-2 bg-black/20 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-[#82d6c5] uppercase font-label-sm w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#82d6c5] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#82d6c5]"></span>
                </span>
                Conexão Ancestral
              </span>
            </div>

            {/* Titles */}
            <div className="flex flex-col gap-4">
              <h2 className="font-headline-lg text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight">
                Bridges of Support for the <span className="text-[#268072]">Amazon Rainforest</span>
              </h2>
              <p className="font-body-md text-base md:text-lg text-white/70 leading-relaxed">
                Conexão Ancestral acts as a vital bridge between the wisdom of the forest and the modern world. We support indigenous self-determination in Acre, Brazil, safeguarding ancestral knowledge and protecting traditional territories.
              </p>
            </div>

            {/* Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
              
              {/* Pillar 1 */}
              <div className="flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#268072] group-hover:bg-[#268072]/20 transition-all duration-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-white mb-1">Self-Determination</h4>
                  <p className="font-body-md text-xs text-white/50 leading-relaxed">
                    Strengthening indigenous leadership and autonomous territory management.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#268072] group-hover:bg-[#268072]/20 transition-all duration-300">
                  <Leaf className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-white mb-1">Cultural Preservation</h4>
                  <p className="font-body-md text-xs text-white/50 leading-relaxed">
                    Safeguarding traditional songs, forest medicine, and sacred lineages.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#268072] group-hover:bg-[#268072]/20 transition-all duration-300">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-headline-md text-base font-bold text-white mb-1">Impact Projects</h4>
                  <p className="font-body-md text-xs text-white/50 leading-relaxed">
                    Concrete actions in clean water access, sustainability, and basic infrastructure.
                  </p>
                </div>
              </div>

            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <a
                href="https://www.conexaoancestral.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#DC251E] hover:bg-[#b81d17] text-white font-label-sm text-sm font-bold uppercase tracking-widest py-5 px-10 rounded-sm transition-all duration-300 shadow-lg shadow-black/20 hover:shadow-[#DC251E]/20 cursor-pointer no-underline group border-0"
              >
                Visit Conexão Ancestral
                <ArrowUpRight className="w-4 h-4 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Harmonic Collage Grid */}
          <div 
            className={`lg:col-span-5 flex flex-col gap-4 w-full ngo-animate-item ${visible ? 'animate' : ''}`}
            style={visible ? { animationDelay: '0.35s' } : {}}
          >
            {/* Centerpiece Image (Large) */}
            <div className="rounded-xl overflow-hidden border border-white/10 shadow-xl aspect-[16/10] group cursor-pointer relative">
              <img 
                src="/ngo/collage-5.png" 
                alt="Traditional Amazonian Gathering" 
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/20 to-transparent pointer-events-none" />
            </div>
            
            {/* 2x2 Grid of Corner Images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative">
                <img src="/ngo/collage-1.png" alt="Amazon Forest Canopy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent pointer-events-none" />
              </div>
              <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative">
                <img src="/ngo/collage-2.png" alt="Indigenous Community & Culture" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent pointer-events-none" />
              </div>
              <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative">
                <img src="/ngo/collage-3.png" alt="Sacred Amazonian Botanicals" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent pointer-events-none" />
              </div>
              <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg aspect-[4/3] group cursor-pointer relative">
                <img src="/ngo/collage-4.png" alt="Pristine Forest Stream" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131313]/25 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
