"use client";

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { useCart } from '@/components/CartContext';
import { Menu, X, ArrowRight, LogOut, ShoppingBag } from 'lucide-react';

export default function Header({ onOpenLogin, onOpenApply }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, logout } = useAuth();
  const { cartTotalItems, setIsCartOpen } = useCart();

  const handleHomeClick = (e) => {
    if (pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleHeaderLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 w-full bg-[#212121] border-b-2 border-[#268072] z-50 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between w-full">
        {/* Logotipo (Left) */}
        <a className="flex items-center group shrink-0" href="/" onClick={handleHomeClick}>
          <img 
            src="/logo.svg" 
            alt="Sacred Connection Wholesale Logo" 
            className="h-12 md:h-16 w-auto transition-all duration-300 group-hover:opacity-90"
          />
        </a>

        {/* Navigation Links (Center - Desktop Only) */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium tracking-wide text-white/70 font-body-md">
          <a 
            className={`${pathname === '/' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative py-2 transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#82d6c5] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/"
            onClick={handleHomeClick}
          >
            Home
          </a>
          <a className="relative py-2 hover:text-white transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:scale-x-0 after:bg-[#82d6c5] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:after:scale-x-100 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none" href="/#tribes">
            About the Tribes
          </a>
          <a 
            className={`${pathname === '/catalog' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative py-2 transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#82d6c5] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/catalog"
          >
            Wholesale Catalog
          </a>
          <a 
            className={`${pathname === '/contact' ? 'text-white after:scale-x-100' : 'hover:text-white after:scale-x-0 hover:after:scale-x-100'} relative py-2 transition-all duration-300 ease-out after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:w-full after:origin-center after:bg-[#82d6c5] after:shadow-[0_0_10px_rgba(130,214,197,0.65)] after:transition-transform after:duration-300 hover:-translate-y-0.5 hover:drop-shadow-[0_0_8px_rgba(130,214,197,0.45)] motion-reduce:transform-none`}
            href="/contact"
          >
            Contact
          </a>
        </nav>

        {/* CTA Actions (Right - Desktop Only) */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
          {/* Cart Icon Trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartTotalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#268072] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-[#131313]">
                {cartTotalItems}
              </span>
            )}
          </button>

          {isLoggedIn ? (
            <>
              <a 
                href="/my-account"
                className={`text-sm font-medium ${pathname === '/my-account' ? 'text-white border-b-2 border-[#268072]' : 'text-[#82d6c5] hover:text-white'} pb-1 transition-colors`}
              >
                My Account
              </a>
              <button 
                onClick={handleHeaderLogout}
                className="bg-[#93000a]/15 hover:bg-[#93000a]/30 text-[#ffb4ab] text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-sm border border-[#93000a]/30 hover:border-[#ffb4ab]/40 transition-all duration-300 flex items-center gap-2 cursor-pointer"
              >
                Exit Portal
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={onOpenLogin}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors font-body-md bg-transparent border-0 cursor-pointer text-left"
              >
                Client Login
              </button>
              <Link 
                href="/register"
                className="bg-white/10 hover:bg-white text-white hover:text-[#212121] text-xs font-bold tracking-wider uppercase px-5 py-3 rounded-sm border border-white/10 hover:border-white transition-all duration-300 flex items-center gap-2 font-label-sm cursor-pointer no-underline"
              >
                Register Account 
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Cart and Hamburger Container (Mobile Only) */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            {cartTotalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#268072] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#131313]">
                {cartTotalItems}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white/80 hover:text-white focus:outline-none cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-[100%] left-0 w-full bg-[#212121] border-b border-white/10 px-6 py-8 flex flex-col gap-6 md:hidden z-40 backdrop-blur-md shadow-xl animate-fade-in">
          <a 
            className={`${pathname === '/' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#82d6c5] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/"
            onClick={(e) => {
              setMobileMenuOpen(false);
              handleHomeClick(e);
            }}
          >
            Home
          </a>
          <a 
            className="text-white/70 text-base font-medium transition-all duration-300 hover:text-[#82d6c5] hover:translate-x-1.5 motion-reduce:transform-none"
            href="/#tribes"
            onClick={() => setMobileMenuOpen(false)}
          >
            About the Tribes
          </a>
          <a 
            className={`${pathname === '/catalog' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#82d6c5] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/catalog"
            onClick={() => setMobileMenuOpen(false)}
          >
            Wholesale Catalog
          </a>
          <a 
            className={`${pathname === '/contact' ? 'text-white' : 'text-white/70'} text-base font-medium transition-all duration-300 hover:text-[#82d6c5] hover:translate-x-1.5 motion-reduce:transform-none`}
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </a>
          <div className="h-px bg-white/10 my-2"></div>
          {isLoggedIn ? (
            <>
              <a 
                href="/my-account"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium ${pathname === '/my-account' ? 'text-white' : 'text-[#82d6c5] hover:text-white'} transition-colors`}
              >
                My Account
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleHeaderLogout();
                }}
                className="flex items-center gap-2 text-left text-[#ffb4ab] text-base font-medium py-2 bg-transparent border-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Exit Portal
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLogin();
                }}
                className="text-left text-white/80 hover:text-white text-base font-medium py-2 bg-transparent border-0 cursor-pointer"
              >
                Client Login
              </button>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-center text-sm font-bold uppercase tracking-wider py-4 rounded-sm border-0 cursor-pointer w-full no-underline block transition-colors"
              >
                Register Account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
