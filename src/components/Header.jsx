"use client";

import React, { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Header({ onOpenLogin, onOpenApply }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 w-full bg-[#212121] border-b border-white/10 z-50 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between w-full">
        {/* Logotipo (Left) */}
        <a className="flex items-center group shrink-0" href="#">
          <img 
            src="/logo.svg" 
            alt="Sacred Connection Wholesale Logo" 
            className="h-12 md:h-16 w-auto transition-all duration-300 group-hover:opacity-90"
          />
        </a>

        {/* Navigation Links (Center - Desktop Only) */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium tracking-wide text-white/70 font-body-md">
          <a className="text-white border-b-2 border-[#268072] pb-1 transition-colors" href="#">
            Home
          </a>
          <a className="hover:text-white transition-colors pb-1" href="#tribes">
            About the Tribes
          </a>
          <a className="hover:text-white transition-colors pb-1" href="#onboarding">
            Wholesale Catalog
          </a>
          <a className="hover:text-white transition-colors pb-1" href="#footer">
            Contact
          </a>
        </nav>

        {/* CTA Actions (Right - Desktop Only) */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          <button 
            onClick={onOpenLogin}
            className="text-sm font-medium text-white/80 hover:text-white transition-colors font-body-md bg-transparent border-0 cursor-pointer text-left"
          >
            Client Login
          </button>
          <button 
            onClick={onOpenApply}
            className="bg-white/10 hover:bg-white text-white hover:text-[#212121] text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-sm border border-white/10 hover:border-white transition-all duration-300 flex items-center gap-2 font-label-sm cursor-pointer"
          >
            Enter Portal 
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hamburger / Close Toggle (Mobile Only) */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white/80 hover:text-white focus:outline-none cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-[100%] left-0 w-full bg-[#212121] border-b border-white/10 px-6 py-8 flex flex-col gap-6 md:hidden z-40 backdrop-blur-md shadow-xl animate-fade-in">
          <a 
            className="text-white text-base font-medium" 
            href="#"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </a>
          <a 
            className="text-white/70 hover:text-white text-base font-medium transition-colors" 
            href="#tribes"
            onClick={() => setMobileMenuOpen(false)}
          >
            About the Tribes
          </a>
          <a 
            className="text-white/70 hover:text-white text-base font-medium transition-colors" 
            href="#onboarding"
            onClick={() => setMobileMenuOpen(false)}
          >
            Wholesale Catalog
          </a>
          <a 
            className="text-white/70 hover:text-white text-base font-medium transition-colors" 
            href="#footer"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </a>
          <div className="h-px bg-white/10 my-2"></div>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenLogin();
            }}
            className="text-left text-white/80 hover:text-white text-base font-medium py-2 bg-transparent border-0 cursor-pointer"
          >
            Client Login
          </button>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenApply();
            }}
            className="bg-[#268072] text-white text-center text-sm font-bold uppercase tracking-wider py-4 rounded-sm border-0 cursor-pointer w-full"
          >
            Start Application
          </button>
        </div>
      )}
    </header>
  );
}
