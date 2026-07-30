"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck, Sparkles } from "lucide-react";
import { useProducts } from "@/components/ProductsContext";
import {
  recipeScore,
  SUGGESTED_BLEND_RECIPES,
} from "@/lib/order-suggestions";

export default function SuggestedBlendsPreview() {
  const { products, loading } = useProducts();
  const recipe =
    SUGGESTED_BLEND_RECIPES.find(
      (entry) => entry.id === "yawanawa-lineage"
    ) || SUGGESTED_BLEND_RECIPES[0];
  const exampleProducts = products
    .filter(
      (product) =>
        product.inStock !== false && recipeScore(product, recipe) > 0
    )
    .sort(
      (left, right) =>
        recipeScore(right, recipe) - recipeScore(left, recipe) ||
        left.name.localeCompare(right.name)
    )
    .slice(0, 3);

  return (
    <section
      id="suggested-blends"
      className="scroll-mt-28 overflow-hidden rounded-xl border border-[#82d6c5]/25 bg-[#102c27]"
    >
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.72fr)] md:items-center md:p-8">
        <div>
          <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#82d6c5]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Suggested Blends
          </span>
          <h2 className="mt-3 font-headline-md text-2xl font-bold text-white md:text-3xl">
            Smarter ready-to-build wholesale orders
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
            Explore curated assortments by lineage and product profile. Every
            list is rebuilt from live availability before it can be added.
          </p>
          <Link
            href="/suggested-blends"
            className="mt-5 inline-flex items-center gap-2 rounded-sm bg-[#EC2300] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white no-underline transition-colors hover:bg-[#c51d00]"
          >
            View all suggested blends
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#171717] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#82d6c5]">
                Example blend
              </span>
              <h3 className="mt-1 text-lg font-bold text-white">
                {recipe.title}
              </h3>
            </div>
            <PackageCheck
              className="h-5 w-5 shrink-0 text-emerald-300"
              aria-hidden="true"
            />
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {exampleProducts.length > 0 ? (
              exampleProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 border-b border-white/5 pb-2.5 last:border-0 last:pb-0"
                >
                  <span className="truncate text-xs font-semibold text-white/75">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-[8px] font-bold uppercase text-emerald-200">
                    In stock
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs leading-relaxed text-white/45">
                {loading
                  ? "Checking the current Yawanawá assortment…"
                  : "This example will return when qualifying products are in stock."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
