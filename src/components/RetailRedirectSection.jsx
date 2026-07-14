import React from 'react';

export default function RetailRedirectSection() {
  return (
    <section
      aria-label="Retail Store Redirection"
      className="relative isolate w-full overflow-hidden bg-[#111616] bg-[url('/banner/retail-sanctuary/retail-sanctuary-banner-mobile.webp')] bg-cover bg-center md:bg-[url('/banner/retail-sanctuary/retail-sanctuary-banner-desktop.webp')]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-[#111616]/95 via-[#111616]/80 to-black/45 md:bg-gradient-to-r md:from-[#111616]/98 md:via-[#111616]/75 md:to-black/30"
      />

      <div className="mx-auto flex min-h-[340px] w-full max-w-7xl items-center px-4 py-14 sm:min-h-[380px] sm:px-6 sm:py-16 lg:min-h-[420px] lg:px-8 lg:py-20">
          <div className="max-w-xl">
            <p className="mb-3 font-label-sm text-xs font-bold uppercase tracking-[0.18em] text-[#82d6c5]">
              Individual Orders &amp; Retail
            </p>

            <h2 className="font-headline-lg text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              Looking for Personal Use? Visit Our Retail Sanctuary.
            </h2>

            <p className="mt-5 max-w-lg font-body-md text-sm leading-7 text-neutral-300 sm:text-base">
              Explore our curated collection of sustainably harvested sacred snuffs, handcrafted accessories, and botanical blends available for individual worldwide shipping at Sacred Snuff.
            </p>

            <a
              href="https://sacred-snuff.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Explore the Sacred Snuff Retail Store in a new tab"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/40 px-6 py-3.5 font-label-sm text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#82d6c5] sm:w-auto"
            >
              Explore Retail Store
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
              >
                <path
                  d="M8 16L16 8M10 8H16V14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
      </div>
    </section>
  );
}
