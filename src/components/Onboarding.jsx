"use client";

import React from 'react';

export default function Onboarding({ onOpenApply }) {
  return (
    <section id="onboarding" className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-16 flex flex-col gap-16 relative overflow-hidden scroll-mt-24">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#268072] opacity-[0.03] blur-[100px] pointer-events-none rounded-full"></div>

      <div className="text-center max-w-2xl mx-auto z-10">
        <h2 className="font-headline-lg text-4xl font-black tracking-tighter text-white mb-4">
          Streamlined Wholesale Access
        </h2>
        <p className="font-body-md text-lg text-white/70">
          Join our network of premium retailers and holistic practitioners. Our vetting process ensures ethical alignment and dedicated support for your business.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 z-10 relative">
        {/* Connecting Line for Desktop */}
        <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-white/10 -z-10"></div>
        
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center gap-6 group">
          <div className="w-20 h-20 rounded-full bg-[#131313] border border-white/20 flex items-center justify-center group-hover:border-[#82d6c5] transition-colors shadow-xl">
            <span className="font-headline-md text-xl font-bold text-white/50 group-hover:text-[#82d6c5]">01</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-white mb-2">Submit Application</h3>
            <p className="font-body-md text-base text-white/70">Provide your business details and resale intent through our secure portal.</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-center text-center gap-6 group">
          <div className="w-20 h-20 rounded-full bg-[#131313] border border-white/20 flex items-center justify-center group-hover:border-[#82d6c5] transition-colors shadow-xl">
            <span className="font-headline-md text-xl font-bold text-white/50 group-hover:text-[#82d6c5]">02</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-white mb-2">Verification</h3>
            <p className="font-body-md text-base text-white/70">Our team reviews your application within 48 hours for ethical alignment.</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col items-center text-center gap-6 group">
          <div className="w-20 h-20 rounded-full bg-[#131313] border border-white/20 flex items-center justify-center group-hover:border-[#82d6c5] transition-colors shadow-xl">
            <span className="font-headline-md text-xl font-bold text-white/50 group-hover:text-[#82d6c5]">03</span>
          </div>
          <div>
            <h3 className="font-headline-md text-2xl font-bold text-white mb-2">Direct Access</h3>
            <p className="font-body-md text-base text-white/70">Unlock wholesale pricing, bulk ordering, and dedicated account management.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8 z-10">
        <button 
          onClick={onOpenApply}
          className="bg-[#268072] text-white font-label-sm text-sm font-bold uppercase tracking-widest py-6 px-16 rounded-sm hover:bg-[#1f665b] transition-all duration-300 shadow-lg shadow-[#268072]/20 hover:shadow-[#268072]/40 cursor-pointer border-0"
        >
          Start Application
        </button>
      </div>
    </section>
  );
}
