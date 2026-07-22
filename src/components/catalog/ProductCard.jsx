"use client";

/* eslint-disable @next/next/no-img-element -- Product images are remote WooCommerce media. */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole, ShoppingBag } from "lucide-react";
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const selectedOption = product.options[optionIndex] || product.options[0];
  const description =
    product.description || "Wholesale product from the Sacred Connection collection.";
  const hasLongDescription = description.length > 180;
  const descriptionId = `product-description-${product.id}`;
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
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03]"
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

      {product.isNew && (
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-sm bg-[#268072] px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-white">
            New
          </span>
        </div>
      )}
    </>
  );

  return (
    <article className="group grid min-w-0 grid-cols-1 items-stretch overflow-hidden rounded-sm border border-white/10 bg-[#1a1a1a] transition-all duration-300 hover:border-[#268072]/60 hover:shadow-xl hover:shadow-black/20 sm:grid-cols-[12rem_minmax(0,1fr)] lg:grid-cols-[14rem_minmax(0,1fr)]">
      {isLoggedIn ? (
        <Link
          href={product.productUrl}
          aria-label={`View ${product.name}`}
          className="relative block h-56 overflow-hidden border-b border-white/10 bg-white sm:h-full sm:min-h-56 sm:border-b-0 sm:border-r"
        >
          {media}
        </Link>
      ) : (
        <div className="relative block h-56 overflow-hidden border-b border-white/10 bg-white sm:h-full sm:min-h-56 sm:border-b-0 sm:border-r">
          {media}
        </div>
      )}

      <div className="flex min-w-0 flex-col p-4 sm:p-5 lg:p-6">
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[#82d6c5]">
              {product.category}
            </p>
            {isLoggedIn ? (
              <Link href={product.productUrl} className="block no-underline">
                <h2 className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#82d6c5] sm:text-xl">
                  {product.name}
                </h2>
              </Link>
            ) : (
              <h2 className="text-lg font-bold leading-snug text-white transition-colors group-hover:text-[#82d6c5] sm:text-xl">
                {product.name}
              </h2>
            )}
          </div>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/25 transition-colors group-hover:text-[#82d6c5]" aria-hidden="true" />
        </div>

        <p
          id={descriptionId}
          className={`whitespace-pre-line text-sm leading-6 text-white/55 sm:text-[15px] sm:leading-7 ${
            hasLongDescription && !isDescriptionExpanded ? "line-clamp-4" : ""
          }`}
        >
          {description}
        </p>
        {hasLongDescription && (
          <button
            type="button"
            aria-expanded={isDescriptionExpanded}
            aria-controls={descriptionId}
            onClick={() => setIsDescriptionExpanded((expanded) => !expanded)}
            className="mt-2 self-start text-xs font-black uppercase tracking-[0.1em] text-[#82d6c5] transition-colors hover:text-white"
          >
            {isDescriptionExpanded ? "Show less" : "Read more"}
          </button>
        )}

        <div className="mt-5 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(12rem,16rem)_auto] xl:items-end">
          <div className="flex items-end justify-between gap-6 sm:col-span-2 sm:justify-start xl:col-span-1 xl:min-w-40">
            <div className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-white/35">
                SKU
              </span>
              <span className="block break-all font-mono text-xs text-white/65">
                {selectedOption?.sku || product.sku}
              </span>
            </div>
            <div className="shrink-0 md:text-left">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-white/35">
                From
              </span>
              <span className="text-lg font-black text-[#82d6c5]">
                {currency.format(price)}
              </span>
            </div>
          </div>

          {product.options.length > 1 && (
            <label className="block min-w-0">
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
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border-0 bg-[#EC2300] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#c51d00] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35 xl:min-w-48 ${
                product.options.length > 1 ? "" : "sm:col-span-2 xl:col-span-1"
              }`}
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Add to order
            </button>
          ) : (
            <button
              type="button"
              onClick={onRequireLogin}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-[#268072]/60 hover:bg-white/10 xl:min-w-48 ${
                product.options.length > 1 ? "" : "sm:col-span-2 xl:col-span-1"
              }`}
            >
              <LockKeyhole className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
              Sign in to order
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
