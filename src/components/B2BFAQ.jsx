import { ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What is the Minimum Order Value (MOV) for new wholesale accounts?",
    answer:
      "To maintain the exclusivity of our ancestral lineages, our initial MOV is $500, scaling dynamically based on your chosen tier.",
  },
  {
    question: "How does the Net-30 credit limit process work?",
    answer:
      "Once vetted, established retail partners gain access to 30-day payment terms, ensuring smooth inventory flow and sustained business expansion.",
  },
  {
    question: "Can I request sample kits before committing to bulk?",
    answer:
      "Yes. Verified B2B accounts can order curated Sample Vials to assess the energetic signature and physical quality of our blends before larger acquisitions.",
  },
];

export default function B2BFAQ() {
  return (
    <section
      aria-labelledby="b2b-faq-title"
      className="b2b-faq-card relative isolate w-full overflow-hidden rounded-xl border border-white/15 bg-[#1a1a1a] px-5 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.14)] transition-all duration-500 sm:px-7 sm:py-10 lg:px-10 lg:py-12"
    >
      <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[#268072]/12 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
        <div className="max-w-md">
          <p className="mb-3 font-label-sm text-[10px] font-bold uppercase tracking-[0.2em] text-[#82d6c5] sm:text-xs">
            Wholesale Support
          </p>
          <h2
            id="b2b-faq-title"
            className="font-headline-lg text-3xl font-black tracking-tighter text-white sm:text-4xl"
          >
            B2B Operational Clarity
          </h2>
          <p className="mt-4 font-body-md text-sm leading-relaxed text-white/60 sm:text-base">
            Clear terms for planning your first order, managing inventory, and scaling your wholesale partnership.
          </p>
        </div>

        <div className="flex flex-col border-t border-white/10">
          {FAQ_ITEMS.map(({ question, answer }, index) => (
            <details
              key={question}
              className="b2b-faq-item group relative border-b border-white/10"
              open={index === 0}
            >
              <span className="absolute inset-y-4 left-0 w-px origin-top scale-y-0 bg-[#82d6c5] shadow-[0_0_10px_rgba(130,214,197,0.45)] transition-transform duration-300 ease-out group-open:scale-y-100" aria-hidden="true" />
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 pl-4 text-left [&::-webkit-details-marker]:hidden sm:py-6">
                <h3 className="b2b-faq-question font-headline-md text-base font-bold leading-snug text-white transition-colors duration-300 group-hover:text-[#82d6c5] group-open:text-[#82d6c5] sm:text-lg">
                  {question}
                </h3>
                <span className="b2b-faq-toggle flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#131313]/55 text-[#82d6c5] transition-all duration-300 group-open:rotate-180 group-open:border-[#82d6c5]/35 group-open:bg-[#268072]/15">
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </span>
              </summary>
              <div className="pb-6 pl-4 pr-11 sm:pr-14">
                <p className="max-w-2xl font-body-md text-sm leading-relaxed text-white/60 sm:text-base">
                  {answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
