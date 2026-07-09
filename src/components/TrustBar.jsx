"use client";

import React from 'react';
import { ShieldAlert, Users, ArrowRight } from 'lucide-react';

export default function TrustBar({ onOpenApply }) {
  return (
    <div className="w-full bg-[#131313]">
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-24 w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10 rounded-sm overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10 bg-[#1a1a1a]">
          
          {/* Card 1: B2B Program */}
          <div className="p-10 flex flex-col justify-between items-start gap-4 hover:bg-white/[0.02] transition-colors group">
            <span className="text-sm font-bold uppercase tracking-widest text-[#268072] font-label-sm">
              B2B Program
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white font-headline-md">
              Start your custom wholesale partnership today
            </h3>
            <button 
              onClick={onOpenApply}
              className="text-base font-semibold underline decoration-[#268072] underline-offset-4 hover:text-[#268072] transition-colors flex items-center gap-2 font-body-md bg-transparent border-0 cursor-pointer text-white text-left p-0"
            >
              Commercial Application <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Sustainability */}
          <div className="p-10 flex flex-col justify-between items-start gap-4 hover:bg-white/[0.02] transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[#268072]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-2 font-headline-md">
                100% Sustainable &amp; Fair-Trade
              </h3>
              <p className="text-sm text-white/50 leading-relaxed font-body-md">
                Direct profit split with indigenous artisans and local geometric gatherers.
              </p>
            </div>
          </div>

          {/* Card 3: Metrics */}
          <div className="p-10 flex flex-col justify-center gap-4 bg-[#1a1a1a]">
            <span className="text-5xl font-black tracking-tighter text-white block font-headline-lg">
              +14K
            </span>
            <span className="text-sm font-medium text-white/50 tracking-wide uppercase font-label-sm">
              Global batches delivered to verified retail partners.
            </span>
            <div className="flex -space-x-3 overflow-hidden opacity-90 mt-4">
              <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#212121] bg-[#268072] flex items-center justify-center text-xs font-bold text-white font-mono">
                PT
              </div>
              <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#212121] bg-white/20 flex items-center justify-center text-xs font-bold text-white font-mono">
                UK
              </div>
              <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#212121] bg-white/30 flex items-center justify-center text-xs font-bold text-white font-mono">
                US
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
