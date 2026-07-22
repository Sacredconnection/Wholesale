"use client";

import { Filter, RotateCcw, Search } from "lucide-react";

export default function FilterSidebar({
  filters,
  categories,
  priceBounds,
  onChange,
  onClear,
  disabled = false,
}) {
  const update = (field, value) => onChange({ ...filters, [field]: value });

  return (
    <aside className="rounded-sm border border-white/10 bg-[#1a1a1a] p-5 sm:p-6 lg:p-8">
      <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white sm:mb-6">
        <Filter className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
        Filter products
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-[1.15fr_1fr_1fr_auto] xl:items-end xl:gap-6">
        <div className="min-w-0">
          <label
            htmlFor="catalog-search"
            className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-white/55"
          >
            Product, SKU or ethnicity
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="search"
              value={filters.search}
              onChange={(event) => update("search", event.target.value)}
              placeholder="Search product or ethnicity..."
              autoComplete="off"
              className="w-full rounded-sm border border-white/10 bg-[#131313] py-3.5 pl-10 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#268072]"
            />
          </div>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="catalog-category"
            className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-white/55"
          >
            Category
          </label>
          <select
            id="catalog-category"
            value={filters.category}
            onChange={(event) => update("category", event.target.value)}
            className="w-full rounded-sm border border-white/10 bg-[#131313] px-3 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#268072]"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="min-w-0 sm:col-span-2 xl:col-span-1">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-wider text-white/55">
            Price range (USD)
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="catalog-min-price" className="sr-only">
                Minimum price
              </label>
              <input
                id="catalog-min-price"
                type="number"
                min={0}
                max={priceBounds.max || undefined}
                step="0.01"
                inputMode="decimal"
                value={filters.minPrice}
                onChange={(event) => update("minPrice", event.target.value)}
                placeholder={`Min ${priceBounds.min || 0}`}
                className="w-full rounded-sm border border-white/10 bg-[#131313] px-3 py-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#268072]"
              />
            </div>
            <div>
              <label htmlFor="catalog-max-price" className="sr-only">
                Maximum price
              </label>
              <input
                id="catalog-max-price"
                type="number"
                min={0}
                max={priceBounds.max || undefined}
                step="0.01"
                inputMode="decimal"
                value={filters.maxPrice}
                onChange={(event) => update("maxPrice", event.target.value)}
                placeholder={`Max ${priceBounds.max || 0}`}
                className="w-full rounded-sm border border-white/10 bg-[#131313] px-3 py-3.5 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#268072]"
              />
            </div>
          </div>
        </fieldset>

        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2 xl:col-span-1 xl:min-w-44"
        >
          <RotateCcw className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
          Clear filters
        </button>
      </div>
    </aside>
  );
}
