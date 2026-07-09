"use client";

import React from 'react';
import { ShieldCheck, Leaf, Globe, Users } from 'lucide-react';

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#131313] border-t border-white/10 w-full mt-12 scroll-mt-24">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-6 md:px-12 py-24 w-full max-w-7xl mx-auto">
        
        {/* Brand Info */}
        <div className="md:col-span-2 flex flex-col gap-6 pr-8">
          <div className="flex flex-col items-start gap-2">
            <img 
              src="/logo.svg" 
              alt="Sacred Connection Wholesale Logo" 
              className="h-14 md:h-16 w-auto"
            />
          </div>
          <p className="font-body-md text-base text-white/50 leading-relaxed">
            © {new Date().getFullYear()} Sacred Connection Wholesale. Committed to ethical fair-trade sourcing and indigenous preservation.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#82d6c5] uppercase font-label-sm">
            <ShieldCheck className="w-4 h-4" />
            Fair-Trade Certified Disclosure
          </div>
        </div>

        {/* Column 2: Resources */}
        <div className="flex flex-col gap-6">
          <h5 className="font-label-sm text-xs font-bold text-white uppercase tracking-widest">
            Resources
          </h5>
          <nav className="flex flex-col gap-4">
            <a className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="#onboarding">
              Catalog
            </a>
            <a className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="#" onClick={(e) => { e.preventDefault(); alert("Contacting B2B Support..."); }}>
              Support
            </a>
          </nav>
        </div>

        {/* Column 3: Legal */}
        <div className="flex flex-col gap-6">
          <h5 className="font-label-sm text-xs font-bold text-white uppercase tracking-widest">
            Legal
          </h5>
          <nav className="flex flex-col gap-4">
            <a className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="#" onClick={(e) => { e.preventDefault(); alert("Loading Legal disclosures..."); }}>
              Legal Disclosures
            </a>
            <a className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="#" onClick={(e) => { e.preventDefault(); alert("Loading Terms of Service..."); }}>
              Terms of Service
            </a>
          </nav>
        </div>

      </div>

      {/* Under Footer Icons */}
      <div className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <p className="text-xs text-white/40 font-label-sm uppercase tracking-widest">
            Absolute Chemical Purity &amp; Cultural Authenticity
          </p>
          <div className="flex gap-6 text-white/30">
            <Leaf className="w-5 h-5 hover:text-[#82d6c5] transition-colors" />
            <Globe className="w-5 h-5 hover:text-[#82d6c5] transition-colors" />
            <Users className="w-5 h-5 hover:text-[#82d6c5] transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
}
