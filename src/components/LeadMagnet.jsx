import { Mail, Newspaper } from "lucide-react";

export default function LeadMagnet() {
  return (
    <section
      aria-labelledby="newsletter-title"
      className="compendium-section home-green-outline relative isolate w-full overflow-hidden rounded-xl border bg-[#1a1a1a] px-5 py-8 shadow-[0_24px_70px_rgba(0,0,0,0.18)] sm:px-8 sm:py-10 lg:px-12 lg:py-12"
    >
      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:gap-12">
        <div className="max-w-2xl">
          <div className="compendium-icon-shell mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-[#82d6c5] backdrop-blur-sm">
            <Newspaper className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2
            id="newsletter-title"
            className="font-headline-lg text-3xl font-black tracking-tighter text-white sm:text-4xl"
          >
            Stay Connected to the Source
          </h2>
          <p className="mt-4 max-w-xl font-body-md text-sm leading-relaxed text-white/70 sm:text-base">
            Join our wholesale newsletter for new product arrivals, restock updates, sourcing stories, and practical insights for growing your business.
          </p>
        </div>

        <form
          action="mailto:info@sacredconnection.co?subject=Wholesale%20Newsletter%20Subscription"
          method="post"
          encType="text/plain"
          className="compendium-email-box rounded-lg border border-white/10 bg-[#131313]/45 p-3 shadow-xl backdrop-blur-md sm:p-4"
        >
          <label
            htmlFor="newsletter-email"
            className="mb-2 block font-label-sm text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
          >
            Business email
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82d6c5]" aria-hidden="true" />
              <input
                id="newsletter-email"
                name="newsletter-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                placeholder="you@company.com"
                required
                className="compendium-email-input h-12 w-full rounded-sm border border-white/10 bg-[#0f2420]/70 pl-11 pr-4 font-body-md text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#82d6c5]/60"
              />
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 cursor-pointer rounded-sm border-0 bg-[#EC2300] px-6 font-label-sm text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#EC2300]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c51d00] hover:shadow-[#EC2300]/25"
            >
              Join Newsletter
            </button>
          </div>
          <p className="mt-3 font-body-md text-[10px] leading-relaxed text-white/35">
            Your email application will open to confirm your subscription. You can unsubscribe at any time.
          </p>
        </form>
      </div>
    </section>
  );
}
