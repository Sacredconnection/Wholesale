"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ShieldCheck, Leaf, Globe, Users } from 'lucide-react';

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
    <>
      <section
        aria-labelledby="maya-wholesale-banner-title"
        className="maya-wholesale-banner theme-dark-zone relative mb-10 flex items-center overflow-hidden border-t border-white/10 bg-[#171813] bg-cover bg-center px-4 py-10 sm:mb-12 sm:px-6 sm:py-12 lg:px-8"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131313]/88 via-[#131313]/48 to-[#131313]/8 md:bg-gradient-to-r md:from-[#131313]/90 md:via-[#131313]/65 md:to-[#131313]/15"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-65 md:block"
          aria-hidden="true"
        />
        <div
          className="relative z-10 mx-auto flex w-full max-w-7xl items-center"
        >
          <div className="relative w-full max-w-3xl text-left lg:w-[58%]">
            <Image
              src="/banner/maya-wholesale/logo-maya-wholesale.svg"
              alt="Maya Ethnobotanicals"
              width={600}
              height={210}
              unoptimized
              className="h-auto w-60 object-contain object-left sm:w-[300px]"
            />
            <div className="ml-[19px] sm:ml-6">
              <h2
                id="maya-wholesale-banner-title"
                className="mt-7 max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl"
              >
                Expand your business with authentic botanical ingredients
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
                Explore wholesale herbs, plant medicines, superfoods and natural
                incense selected for professional use and global supply.
              </p>
              <a
                href="https://wholesale.mayaherbs.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#cc6633] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#df7741] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c38b]"
                aria-label="Visit Maya Ethnobotanicals wholesale website in a new tab"
              >
                Visit Maya Wholesale
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

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
          <h5 className="font-label-sm text-xs font-bold text-white uppercase tracking-widest">
            Resources
          </h5>
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
          <h5 className="font-label-sm text-xs font-bold text-white uppercase tracking-widest">
            Legal
          </h5>
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
            <Leaf className="w-5 h-5 hover:text-[#82d6c5] transition-colors" />
            <Globe className="w-5 h-5 hover:text-[#82d6c5] transition-colors" />
            <Users className="w-5 h-5 hover:text-[#82d6c5] transition-colors" />
          </div>
        </div>
      </div>
      </footer>
    </>
  );
}
