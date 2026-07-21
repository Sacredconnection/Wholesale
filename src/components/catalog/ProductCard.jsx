"use client";

/* eslint-disable @next/next/no-img-element -- Product images are remote WooCommerce media. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CircleHelp, LockKeyhole, PackageX, ShoppingBag } from "lucide-react";
import { optionPriceForUser } from "@/lib/pricing";
import { getEthnicityColor } from "@/lib/ethnicity-colors";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default function ProductCard({
  product,
  user,
  isLoggedIn,
  onAddToCart,
  onRequireLogin,
}) {
  const [optionIndex, setOptionIndex] = useState(0);
  const selectedOption = product.options[optionIndex] || product.options[0];
  const price = useMemo(
    () => optionPriceForUser(selectedOption, user, product.category),
    [selectedOption, user, product.category]
  );

  const media = (
    <>
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-7xl font-black text-white/90"
          style={{
            backgroundColor: getEthnicityColor(product.tribe, product.category),
          }}
        >
          {(product.tribe || product.name).charAt(0).toUpperCase()}
        </div>
      )}

      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
        {product.isNew && (
          <span className="rounded-sm bg-[#268072] px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white">
            New
          </span>
        )}
        <span
          className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${
            product.stockKnown === false
              ? "bg-[#20231f]/90 text-[#d8c99b]"
              : product.inStock
              ? "bg-[#11241f]/90 text-[#82d6c5]"
              : "bg-[#2b1714]/90 text-[#ff806b]"
          }`}
        >
          {product.stockKnown === false ? (
            <CircleHelp className="h-3 w-3" aria-hidden="true" />
          ) : product.inStock ? (
            <Check className="h-3 w-3" aria-hidden="true" />
          ) : (
            <PackageX className="h-3 w-3" aria-hidden="true" />
          )}
          {product.stockKnown === false
            ? "Stock not synced"
            : product.inStock
              ? "In stock"
              : "Unavailable"}
        </span>
      </div>
    </>
  );

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-sm border border-white/10 bg-[#1a1a1a] transition-all duration-300 hover:-translate-y-1 hover:border-[#268072]/60 hover:shadow-xl hover:shadow-black/20">
      {isLoggedIn ? (
        <Link
          href={product.productUrl}
          aria-label={`View ${product.name}`}
          className="relative block aspect-square overflow-hidden border-b border-white/10 bg-[#131313]"
        >
          {media}
        </Link>
      ) : (
        <div className="relative block aspect-square overflow-hidden border-b border-white/10 bg-[#131313]">
          {media}
        </div>
      )}

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.15em] text-[#82d6c5]">
              {product.category}
            </p>
            {isLoggedIn ? (
              <Link href={product.productUrl} className="block no-underline">
                <h2 className="line-clamp-2 text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#82d6c5]">
                  {product.name}
                </h2>
              </Link>
            ) : (
              <h2 className="line-clamp-2 text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#82d6c5]">
                {product.name}
              </h2>
            )}
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-[#82d6c5]" aria-hidden="true" />
        </div>

        <p className="mb-4 line-clamp-2 text-sm leading-6 text-white/45">
          {product.description || "Wholesale product from the Sacred Connection collection."}
        </p>

        <div className="mb-4 mt-auto flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-white/35">
              SKU
            </span>
            <span className="block truncate font-mono text-xs text-white/65">
              {selectedOption?.sku || product.sku}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-white/35">
              From
            </span>
            <span className="text-lg font-black text-[#82d6c5]">
              {currency.format(price)}
            </span>
          </div>
        </div>

        {product.options.length > 1 && (
          <label className="mb-3 block">
            <span className="sr-only">Choose product option</span>
            <select
              value={optionIndex}
              onChange={(event) => setOptionIndex(Number(event.target.value))}
              className="w-full rounded-sm border border-white/10 bg-[#131313] px-3 py-3 text-xs text-white outline-none transition-colors focus:border-[#268072]"
            >
              {product.options.map((option, index) => (
                <option key={`${option.sku}-${index}`} value={index}>
                  {option.name} - {currency.format(optionPriceForUser(option, user, product.category))}
                </option>
              ))}
            </select>
          </label>
        )}

        {isLoggedIn ? (
          <button
            type="button"
            disabled={product.inStock === false || selectedOption?.inStock === false}
            onClick={() => onAddToCart(product, optionIndex)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm border-0 bg-[#EC2300] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c51d00] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
          >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            Add to order
          </button>
        ) : (
          <button
            type="button"
            onClick={onRequireLogin}
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#268072]/60 hover:bg-white/10"
          >
            <LockKeyhole className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
            Sign in to order
          </button>
        )}
      </div>
    </article>
  );
}
