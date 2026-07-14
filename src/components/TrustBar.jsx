"use client";

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Leaf, TrendingUp } from 'lucide-react';

const COUNTRY_FLAGS = [
  { name: 'Brazil', src: '/flags/brazil.svg' },
  { name: 'Netherlands', src: '/flags/netherlands.svg' },
  { name: 'United States', src: '/flags/united-states.svg' },
];

export default function TrustBar({ onOpenApply }) {
  const metricRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [batchCount, setBatchCount] = useState(0);

  useEffect(() => {
    const metric = metricRef.current;
    if (!metric) return;

    const runCounter = () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setBatchCount(14);
        return;
      }

      const duration = 1600;
      const startedAt = performance.now();

      const updateCounter = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        setBatchCount(Math.round(easedProgress * 14));

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(updateCounter);
        }
      };

      animationFrameRef.current = requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        runCounter();
        observer.disconnect();
      }
    }, { threshold: 0.45 });

    observer.observe(metric);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full bg-[#131313]">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 lg:py-16 w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/10 rounded-sm overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10 bg-[#23403B]">
          
          {/* Card 1: B2B Program */}
          <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col justify-between items-start gap-4 overflow-hidden transition-[background-color,box-shadow] duration-500 ease-out hover:bg-[#294a43] hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] group motion-reduce:transition-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#82d6c5]/10 border border-[#82d6c5]/20 flex items-center justify-center text-[#82d6c5] transition-colors duration-500 group-hover:bg-[#82d6c5]/15 group-hover:border-[#82d6c5]/30">
                <BriefcaseBusiness className="w-5 h-5" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-white font-label-sm">
                B2B Program
              </span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white font-headline-md">
              Start your custom wholesale partnership today
            </h3>
            <Link 
              href="/register"
              className="text-base font-semibold underline decoration-white underline-offset-4 hover:text-white transition-colors flex items-center gap-2 font-body-md text-white text-left p-0 no-underline cursor-pointer"
            >
              Commercial Application <ArrowRight className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </Link>
          </div>

          {/* Card 2: Sustainability */}
          <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col justify-between items-start gap-4 overflow-hidden transition-[background-color,box-shadow] duration-500 ease-out hover:bg-[#294a43] hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] group motion-reduce:transition-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#82d6c5]/10 border border-[#82d6c5]/20 flex items-center justify-center text-[#82d6c5] transition-colors duration-500 group-hover:bg-[#82d6c5]/15 group-hover:border-[#82d6c5]/30">
                <Leaf className="w-5 h-5 transition-transform duration-500 group-hover:-rotate-3 motion-reduce:transform-none" aria-hidden="true" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-white font-label-sm">
                Ethical Sourcing
              </span>
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
          <div className="relative p-6 sm:p-8 lg:p-10 flex flex-col justify-center gap-4 overflow-hidden transition-[background-color,box-shadow] duration-500 ease-out hover:bg-[#294a43] hover:shadow-[0_12px_30px_rgba(0,0,0,0.16)] group motion-reduce:transition-none">
            <div className="inline-flex w-fit items-center gap-3">
              <span ref={metricRef} className="inline-flex items-baseline text-4xl sm:text-5xl font-black tracking-tighter text-white font-headline-lg tabular-nums" aria-label="More than fourteen thousand batches delivered">
                <span aria-hidden="true">+</span>
                <span className="inline-flex min-w-[1.45ch] justify-end overflow-hidden" aria-hidden="true">
                  <span key={batchCount} className="inline-block animate-number-rise">
                    {batchCount}
                  </span>
                </span>
                <span aria-hidden="true">K</span>
              </span>
              <TrendingUp className="w-6 h-6 text-[#82d6c5] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden="true" />
            </div>
            <span className="text-sm font-medium text-white/50 tracking-wide uppercase font-label-sm">
              Global batches delivered to verified retail partners.
            </span>
            <div className="flex -space-x-2.5 opacity-90 mt-4" aria-label="Partner countries">
              {COUNTRY_FLAGS.map((country) => (
                <div
                  key={country.name}
                  className="inline-flex h-10 w-10 rounded-full ring-2 ring-[#23403B] bg-[#1a1a1a] border border-white/10 items-center justify-center select-none transition-colors duration-500 group-hover:ring-[#294a43]"
                  title={country.name}
                >
                  <Image
                    src={country.src}
                    alt={`${country.name} flag`}
                    width={26}
                    height={18}
                    unoptimized
                    className="h-[18px] w-[26px] rounded-[2px] object-cover shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
