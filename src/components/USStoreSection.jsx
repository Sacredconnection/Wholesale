import { ArrowUpRight } from "lucide-react";

export default function USStoreSection() {
  return (
    <section aria-labelledby="us-store-title" className="rounded-xl border border-[#82d6c5]/30 bg-[#183b35] p-6 sm:p-10">
      <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#82d6c5]">Sacred Connection USA</p>
          <h2 id="us-store-title" className="mt-3 text-2xl font-black text-white sm:text-3xl">Are you in the USA?</h2>
          <p className="mt-4 text-base leading-7 text-white/75">Shop through our US-based wholesale website for customers in the United States.</p>
        </div>
        <a href="https://wholesale.sacred-snuff.com/" target="_blank" rel="noopener noreferrer" aria-label="Shop our USA website — opens in a new tab" className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-sm bg-[#82d6c5] px-6 py-4 text-sm font-bold text-[#183b35] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:w-auto">
          Shop our USA website <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
