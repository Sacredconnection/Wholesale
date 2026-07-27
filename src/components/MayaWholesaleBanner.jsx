import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function MayaWholesaleBanner() {
  return (
    <section
      aria-labelledby="maya-wholesale-banner-title"
      className="maya-wholesale-banner theme-dark-zone relative mb-10 flex items-center overflow-hidden border-t border-white/10 bg-[#171813] bg-cover bg-center px-4 py-10 sm:mb-12 sm:px-6 sm:py-12 lg:px-8"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#131313]/88 via-[#131313]/48 to-[#131313]/8 md:bg-gradient-to-r md:from-[#131313]/90 md:via-[#131313]/65 md:to-[#131313]/15"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-[#131313] via-transparent to-transparent opacity-65 md:block"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center">
        <div className="relative w-full max-w-3xl text-left lg:w-[58%]">
          <Image
            src="/banner/maya-wholesale/logo-maya-wholesale.svg"
            alt="Maya Ethnobotanicals"
            width={600}
            height={210}
            unoptimized
            className="h-auto w-60 object-contain object-left sm:w-[300px]"
          />
          <div className="ml-[19px] sm:ml-6">
            <h2
              id="maya-wholesale-banner-title"
              className="mt-7 max-w-2xl text-2xl font-black leading-tight text-white sm:text-3xl"
            >
              Expand your business with authentic ethnobotanicals
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 sm:text-base">
              Explore wholesale ethnobotanical herbs, plant medicines,
              superfoods and natural incense selected for professional use and
              global supply.
            </p>
            <a
              href="https://wholesale.mayaherbs.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[#cc6633] px-6 py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-black/20 transition-colors hover:bg-[#df7741] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e0c38b]"
              aria-label="Visit Maya Ethnobotanicals wholesale website in a new tab"
            >
              Visit Maya Wholesale
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
