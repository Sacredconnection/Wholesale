import { ArrowDownToLine, Mail } from "lucide-react";

export default function LeadMagnet() {
  return (
    <section
      aria-labelledby="lead-magnet-title"
      className="compendium-section relative isolate w-full overflow-hidden rounded-xl border border-[#82d6c5]/20 bg-gradient-to-br from-[#173b35] via-[#1c4941] to-[#14342f] px-5 py-8 shadow-[0_26px_75px_rgba(0,0,0,0.18)] sm:px-8 sm:py-10 lg:px-12 lg:py-12"
    >
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#82d6c5]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-[#268072]/20 blur-3xl" />

      <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)] lg:gap-12">
        <div className="max-w-2xl">
          <div className="compendium-icon-shell mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.07] text-[#82d6c5] backdrop-blur-sm">
            <ArrowDownToLine className="compendium-download-icon h-5 w-5" aria-hidden="true" />
          </div>
          <h2
            id="lead-magnet-title"
            className="font-headline-lg text-3xl font-black tracking-tighter text-white sm:text-4xl"
          >
            Access the Ancestral Compendium
          </h2>
          <p className="mt-4 max-w-xl font-body-md text-sm leading-relaxed text-white/70 sm:text-base">
            Not ready for full registration? Enter your professional email to receive our comprehensive 2026 B2B Catalog, pricing tiers, and detailed Rapeh blend specifications.
          </p>
        </div>

        <form
          action="mailto:info@sacredconnection.co?subject=2026%20B2B%20Catalog%20Request"
          method="post"
          encType="text/plain"
          className="compendium-email-box rounded-lg border border-white/10 bg-[#131313]/45 p-3 shadow-xl backdrop-blur-md sm:p-4"
        >
          <label
            htmlFor="catalog-email"
            className="mb-2 block font-label-sm text-[10px] font-bold uppercase tracking-[0.16em] text-white/55"
          >
            Professional email
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#82d6c5]" aria-hidden="true" />
              <input
                id="catalog-email"
                name="professional-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                required
                className="compendium-email-input h-12 w-full rounded-sm border border-white/10 bg-[#0f2420]/70 pl-11 pr-4 font-body-md text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#82d6c5]/60"
              />
            </div>
            <button
              type="submit"
              className="h-12 shrink-0 cursor-pointer rounded-sm border-0 bg-[#EC2300] px-6 font-label-sm text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#EC2300]/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c51d00] hover:shadow-[#EC2300]/25"
            >
              Download Catalog
            </button>
          </div>
          <p className="mt-3 font-body-md text-[10px] leading-relaxed text-white/35">
            Your email application will open with a prepared catalog request.
          </p>
        </form>
      </div>
    </section>
  );
}
