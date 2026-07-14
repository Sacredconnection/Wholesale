"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const steps = [
  {
    num: "01",
    title: "Register B2B Account",
    desc: "Fill out the 3-step registration form with your identity, business information, and secure password.",
  },
  {
    num: "02",
    title: "Vetting & Approval",
    desc: "Our compliance team reviews your business credentials and tax ID/business license within 48 hours.",
  },
  {
    num: "03",
    title: "Access Wholesale Portal",
    desc: "Once approved, log in with your credentials to unlock bulk prices, Net-30 credit limits, and custom discounts.",
  },
];

export default function Onboarding({ onOpenApply }) {
  const sectionRef = useRef(null);
  const lineRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes stepFadeUp {
          from { opacity: 0; transform: translateY(36px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lineFill {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes circlePulse {
          0%   { box-shadow: 0 0 0 0 rgba(130, 214, 197, 0.45); }
          70%  { box-shadow: 0 0 0 16px rgba(130, 214, 197, 0); }
          100% { box-shadow: 0 0 0 0 rgba(130, 214, 197, 0); }
        }
        .step-item {
          opacity: 0;
          transform: translateY(36px);
        }
        .step-item.animate {
          animation: stepFadeUp 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .step-item.animate .step-circle {
          animation: circlePulse 1.1s ease-out 0.4s 1;
        }
        .connector-line-fill {
          transform-origin: left center;
          transform: scaleX(0);
        }
        .connector-line-fill.animate {
          animation: lineFill 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
        }
      `}</style>

      <section
        ref={sectionRef}
        id="onboarding"
        className="relative mx-auto mt-12 flex w-full max-w-6xl scroll-mt-24 flex-col items-center gap-10 rounded-2xl border border-white/10 bg-[#1a1a1a] px-5 py-10 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:mt-14 sm:gap-12 sm:px-8 sm:py-12 lg:mt-16 lg:gap-16 lg:px-12 lg:py-16"
      >
        {/* Header */}
        <div
          className="w-full max-w-3xl text-center z-10 step-item"
          style={visible ? { animation: 'stepFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0s forwards' } : {}}
        >
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-black tracking-tighter text-white mb-3 sm:mb-4">
            Streamlined Wholesale Access
          </h2>
          <p className="font-body-md text-lg text-white/70">
            Join our network of premium retailers and holistic practitioners. Our vetting process ensures ethical alignment and dedicated support for your business.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="relative z-10 grid w-full grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-8">

          {/* Connecting Line Background */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-white/10 -z-10" />

          {/* Animated fill on top of the line */}
          <div
            className={`hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-[#268072] to-[#82d6c5] -z-10 connector-line-fill${visible ? ' animate' : ''}`}
          />

          {steps.map((step, i) => (
            <div
              key={step.num}
              className={`step-item flex flex-col items-center text-center gap-4 sm:gap-6 group${visible ? ' animate' : ''}`}
              style={visible ? { animationDelay: `${0.2 + i * 0.18}s` } : {}}
            >
              <div
                className="step-circle w-20 h-20 rounded-full bg-[#131313] border border-white/20 flex items-center justify-center group-hover:border-[#82d6c5] transition-colors duration-300 shadow-xl"
              >
                <span className="font-headline-md text-xl font-bold text-white/50 group-hover:text-[#82d6c5] transition-colors duration-300">
                  {step.num}
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-2xl font-bold text-white mb-2">{step.title}</h3>
                <p className="mx-auto max-w-sm font-body-md text-base text-white/70">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div
          className={`flex w-full justify-center z-10 step-item${visible ? ' animate' : ''}`}
          style={visible ? { animationDelay: '0.75s' } : {}}
        >
          <Link
            href="/register"
            className="w-full sm:w-auto bg-[#EC2300] text-white font-label-sm text-sm font-bold uppercase tracking-widest py-4 sm:py-5 px-8 sm:px-12 lg:px-16 rounded-sm hover:bg-[#c51d00] transition-all duration-300 shadow-lg shadow-[#EC2300]/20 hover:shadow-[#EC2300]/40 cursor-pointer border-0 no-underline text-center"
          >
            Create B2B Account
          </Link>
        </div>
      </section>
    </>
  );
}
