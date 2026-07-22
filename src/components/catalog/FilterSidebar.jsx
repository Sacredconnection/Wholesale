"use client";

import { Filter, RotateCcw, Search } from "lucide-react";

export default function FilterSidebar({
  filters,
  categories,
  tribes,
  onChange,
  onClear,
  disabled = false,
}) {
  const update = (field, value) => onChange({ ...filters, [field]: value });
  const updateCategory = (value) =>
    onChange({ ...filters, category: value, tribe: "" });

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
            onChange={(event) => updateCategory(event.target.value)}
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

        <div className="min-w-0">
          <label
            htmlFor="catalog-tribe"
            className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-white/55"
          >
            Ethnicity / tribe
          </label>
          <select
            id="catalog-tribe"
            value={filters.tribe}
            onChange={(event) => update("tribe", event.target.value)}
            disabled={!filters.category || tribes.length === 0}
            className="w-full rounded-sm border border-white/10 bg-[#131313] px-3 py-3.5 text-sm text-white outline-none transition-colors focus:border-[#268072] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <option value="">
              {!filters.category
                ? "Select a category first"
                : tribes.length === 0
                  ? "No additional filter"
                  : "All ethnicities / tribes"}
            </option>
            {tribes.map((tribe) => (
              <option key={tribe} value={tribe}>
                {tribe}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-sm border border-white/10 bg-white/5 px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-colors hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 xl:min-w-44"
        >
          <RotateCcw className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
          Clear filters
        </button>
      </div>
    </aside>
  );
}
