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
    <aside className="h-fit rounded-sm border border-white/10 bg-[#1a1a1a] p-5 lg:sticky lg:top-28 lg:p-6">
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
          <Filter className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
          Filters
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 border-0 bg-transparent text-[10px] font-bold uppercase tracking-wider text-white/45 transition-colors hover:text-[#82d6c5] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="space-y-6">
        <div>
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

        <div>
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

        <fieldset>
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

      </div>
    </aside>
  );
}
