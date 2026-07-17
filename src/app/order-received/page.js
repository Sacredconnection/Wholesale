"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import { Check, PhoneCall, ClipboardList, ArrowRight } from "lucide-react";

function OrderReceivedContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("number");
  const total = searchParams.get("total");

  return (
    <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 flex flex-col items-center text-center gap-8 sm:gap-10 lg:gap-12">
      <div className="w-20 h-20 rounded-full bg-[#268072]/20 border border-[#268072]/45 flex items-center justify-center animate-fade-in">
        <Check className="w-10 h-10 text-[#82d6c5]" />
      </div>

      <div className="flex flex-col gap-3">
        <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-white">
          Order Received
        </h1>
        {orderNumber && (
          <p className="text-sm font-mono text-white/50">
            Order number:{" "}
            <span className="text-[#82d6c5] font-bold">#{orderNumber}</span>
            {total && (
              <>
                {" "}· Est. total:{" "}
                <span className="text-white font-bold">${Number(total).toFixed(2)}</span>
              </>
            )}
          </p>
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-[#268072]/25 rounded-md p-8 flex flex-col gap-4 max-w-xl">
        <div className="flex items-center justify-center gap-3 text-[#82d6c5]">
          <PhoneCall className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest font-label-sm">
            Payment arranged personally
          </span>
        </div>
        <p className="font-body-md text-sm text-white/70 leading-relaxed">
          Your wholesale order has been registered. <strong className="text-white">No payment
          has been taken yet</strong> — a member of the Sacred Connection team will contact
          you within 24 hours to confirm availability, calculate shipping, and arrange payment.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Link
          href="/my-account"
          className="bg-[#EC2300] hover:bg-[#c51d00] text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 no-underline"
        >
          <ClipboardList className="w-4 h-4" />
          View My Orders
        </Link>
        <Link
          href="/catalog"
          className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-bold uppercase tracking-widest py-4 px-8 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 no-underline"
        >
          Continue Browsing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}

export default function OrderReceivedPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="site-background-page bg-[#23403B] text-[#e5e2e1] min-h-screen flex flex-col font-sans antialiased">
      <Header onOpenLogin={() => setIsLoginOpen(true)} />
      <Suspense fallback={<main className="flex-grow" />}>
        <OrderReceivedContent />
      </Suspense>
      <Footer />
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
