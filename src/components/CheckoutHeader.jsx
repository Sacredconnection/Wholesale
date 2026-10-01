import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";

export default function CheckoutHeader() {
  return (
    <header className="theme-dark-zone sticky top-0 z-40 border-b border-white/10 bg-[#171717]/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:min-h-[4.5rem] sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Sacred Connection Wholesale"
            width={200}
            height={72}
            priority
            className="h-9 w-auto sm:h-10"
          />
          <div className="hidden items-center gap-2 border-l border-white/10 pl-4 text-xs font-bold text-white/65 sm:flex">
            <LockKeyhole className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
            Secure checkout
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-white/40 md:inline">Need help?</span>
          <Link
            href="/contact"
            className="text-xs font-bold text-[#82d6c5] transition-colors hover:text-white"
          >
            Contact us
          </Link>
        </div>
      </div>
    </header>
  );
}
