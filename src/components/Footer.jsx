"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Leaf, Globe, Users } from 'lucide-react';

export default function Footer() {
  const handleLogoClick = (event) => {
    event.preventDefault();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <footer id="footer" className="theme-dark-zone bg-[#212121] border-t border-white/10 w-full scroll-mt-24">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:gap-10 sm:px-6 sm:py-12 lg:grid-cols-4 lg:gap-12 lg:px-8 lg:py-16">
        
        {/* Brand Info */}
        <div className="flex flex-col gap-5 sm:col-span-2 sm:gap-6 lg:pr-8">
          <div className="flex flex-col items-start gap-2">
            <Link
              href="#top"
              onClick={handleLogoClick}
              aria-label="Back to the top of this page"
              className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#82d6c5]"
            >
              <Image
                src="/logo.svg"
                alt="Sacred Connection Wholesale Logo"
                width={200}
                height={72}
                className="h-14 md:h-16 w-auto"
              />
            </Link>
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
          <h2 className="font-label-sm text-xs font-bold text-white uppercase tracking-widest">
            Resources
          </h2>
          <nav className="flex flex-col gap-4">
            <Link className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="/about">
              About
            </Link>
            <Link className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="/catalog">
              Catalog
            </Link>
            <Link className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="/contact">
              Contact
            </Link>
          </nav>
        </div>

        {/* Column 3: Legal */}
        <div className="flex flex-col gap-6">
          <h2 className="font-label-sm text-xs font-bold text-white uppercase tracking-widest">
            Legal
          </h2>
          <nav className="flex flex-col gap-4">
            <Link className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="/shipping-and-returns-policy">
              Shipping and Returns Policy
            </Link>
            <Link className="font-body-md text-base text-white/60 hover:text-[#82d6c5] transition-colors" href="/privacy-policy">
              Privacy Policy
            </Link>
          </nav>
        </div>

      </div>

      {/* Under Footer Icons */}
      <div className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 w-full">
          <p className="text-xs text-white/40 font-label-sm uppercase tracking-widest">
            Absolute Chemical Purity &amp; Cultural Authenticity
          </p>
          <div className="flex gap-6 text-white/30">
            <Leaf className="w-5 h-5 hover:text-[#82d6c5] transition-colors" aria-hidden="true" />
            <Globe className="w-5 h-5 hover:text-[#82d6c5] transition-colors" aria-hidden="true" />
            <Users className="w-5 h-5 hover:text-[#82d6c5] transition-colors" aria-hidden="true" />
          </div>
        </div>
      </div>
    </footer>
  );
}
