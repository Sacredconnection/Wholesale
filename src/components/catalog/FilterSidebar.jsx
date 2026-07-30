"use client";

import { useState } from "react";
import { ChevronDown, Filter, Search } from "lucide-react";

export default function FilterSidebar({
  filters,
  categories,
  tribes,
  attributes = [],
  onChange,
  onClear,
  disabled = false,
  allValue = "",
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const update = (field, value) => onChange({ ...filters, [field]: value });
  const updateCategory = (value) =>
    onChange({
      ...filters,
      category: value,
      tribe: allValue,
      attributes: {},
    });
  const updateTribe = (value) =>
    onChange({
      ...filters,
      tribe: value,
      attributes: {},
    });
  const updateAttribute = (key, value, attributeIndex) =>
    onChange({
      ...filters,
      attributes: Object.fromEntries(
        attributes
          .slice(0, attributeIndex + 1)
          .map((attribute) => [
            attribute.key,
            attribute.key === key
              ? value
              : filters.attributes?.[attribute.key] || "",
          ])
          .filter(([, attributeValue]) => attributeValue)
      ),
    });
  const showTribe = filters.category !== allValue && tribes.length > 0;
  const normalizedCategory = String(filters.category || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const isIndigenousRape = normalizedCategory === "rape indigenous";
  const tribeLabel = isIndigenousRape ? "Indigenous Tribe" : "Product Type";
  const allTribesLabel = isIndigenousRape
    ? "All Tribes"
    : "All Product Types";
  const canShowFirstAttribute =
    filters.category !== allValue &&
    (!showTribe || filters.tribe !== allValue);
  const visibleAttributes = attributes.filter((attribute, index) => {
    if (!canShowFirstAttribute) return false;
    if (index === 0) return true;
    return Boolean(filters.attributes?.[attributes[index - 1].key]);
  });
  const visibleFieldCount =
    3 + (showTribe ? 1 : 0) + visibleAttributes.length;
  const activeFilterCount =
    (filters.category !== allValue ? 1 : 0) +
    (filters.tribe !== allValue ? 1 : 0) +
    Object.values(filters.attributes || {}).filter(Boolean).length;
  const handleClear = () => {
    onClear();
    setMobileFiltersOpen(false);
  };

  return (
    <aside className="flex flex-col gap-3 rounded-xl border border-white/5 bg-[#1a1a1a] p-3 sm:gap-6 sm:p-6 lg:p-8">
      <div className="hidden items-center gap-2 text-xs font-bold uppercase tracking-wider text-white sm:flex">
        <Filter className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />
        Filter Products
      </div>

      <div
        className={`grid grid-cols-[minmax(0,1fr)_3.5rem] items-end gap-3 sm:grid-cols-2 sm:gap-5 lg:gap-6 ${
          visibleFieldCount > 4 ? "lg:grid-cols-3" : showTribe ? "lg:grid-cols-4" : "lg:grid-cols-3"
        }`}
      >
        <div className="flex w-full min-w-0 flex-col gap-0 sm:gap-2">
          <label
            htmlFor="catalog-search"
            className="sr-only text-xs font-semibold uppercase tracking-wide text-white/55 sm:not-sr-only"
          >
            Search
          </label>
          <div className="relative w-full">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
              aria-hidden="true"
            />
            <input
              id="catalog-search"
              type="text"
              value={filters.search}
              onChange={(event) => update("search", event.target.value)}
              placeholder="Name or SKU..."
              autoComplete="off"
              className="w-full rounded-sm border border-white/10 bg-[#131313] py-4 pl-12 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-[#268072]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileFiltersOpen((isOpen) => !isOpen)}
          aria-expanded={mobileFiltersOpen}
          aria-label={mobileFiltersOpen ? "Hide catalog filters" : "Show catalog filters"}
          className={`relative flex h-[54px] w-14 cursor-pointer items-center justify-center rounded-sm border transition-colors sm:hidden ${
            mobileFiltersOpen
              ? "border-[#82d6c5]/60 bg-[#268072]/25 text-white"
              : "border-white/10 bg-[#131313] text-[#82d6c5] hover:border-[#268072]"
          }`}
        >
          <Filter className="h-5 w-5" aria-hidden="true" />
          {activeFilterCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e02401] px-1 text-[10px] font-black text-white"
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className={`${mobileFiltersOpen ? "flex" : "hidden"} col-span-2 w-full min-w-0 flex-col gap-2 sm:col-span-1 sm:flex`}>
          <label
            htmlFor="catalog-category"
            className="text-xs font-semibold uppercase tracking-wide text-white/55"
          >
            Category
          </label>
          <div className="relative">
            <select
              id="catalog-category"
              value={filters.category}
              onChange={(event) => updateCategory(event.target.value)}
              className="w-full cursor-pointer appearance-none rounded-sm border border-white/10 bg-[#131313] px-4 py-4 text-sm text-white outline-none transition-colors focus:border-[#268072]"
            >
              <option value={allValue}>All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
              aria-hidden="true"
            />
          </div>
        </div>

        {showTribe && (
          <div className={`${mobileFiltersOpen ? "flex" : "hidden"} col-span-2 w-full min-w-0 flex-col gap-2 sm:col-span-1 sm:flex`}>
            <label
              htmlFor="catalog-tribe"
              className="text-xs font-semibold uppercase tracking-wide text-white/55"
            >
              {tribeLabel}
            </label>
            <div className="relative">
              <select
                id="catalog-tribe"
                value={filters.tribe}
                onChange={(event) => updateTribe(event.target.value)}
                className="w-full cursor-pointer appearance-none rounded-sm border border-white/10 bg-[#131313] px-4 py-4 text-sm text-white outline-none transition-colors focus:border-[#268072]"
              >
                <option value={allValue}>{allTribesLabel}</option>
                {tribes.map((tribe) => (
                  <option key={tribe} value={tribe}>
                    {tribe}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                aria-hidden="true"
              />
            </div>
          </div>
        )}

        {visibleAttributes.map((attribute) => {
          const attributeIndex = attributes.findIndex(
            (item) => item.key === attribute.key
          );

          return (
            <div
              key={attribute.key}
              className={`${mobileFiltersOpen ? "flex" : "hidden"} col-span-2 w-full min-w-0 flex-col gap-2 sm:col-span-1 sm:flex`}
            >
              <label
                htmlFor={`catalog-attribute-${attribute.key}`}
                className="text-xs font-semibold uppercase tracking-wide text-white/55"
              >
                {attribute.name}
              </label>
              <div className="relative">
                <select
                  id={`catalog-attribute-${attribute.key}`}
                  value={filters.attributes?.[attribute.key] || ""}
                  onChange={(event) =>
                    updateAttribute(
                      attribute.key,
                      event.target.value,
                      attributeIndex
                    )
                  }
                  disabled={attribute.options.length === 0}
                  className="w-full cursor-pointer appearance-none rounded-sm border border-white/10 bg-[#131313] px-4 py-4 text-sm text-white outline-none transition-colors focus:border-[#268072] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <option value="">All {attribute.name}</option>
                  {attribute.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value} ({option.count})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className={`${mobileFiltersOpen ? "block" : "hidden"} col-span-2 w-full cursor-pointer rounded-sm border border-white/10 bg-white/5 px-6 py-4 text-sm font-bold uppercase tracking-wider text-white transition-all duration-300 hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-1 sm:block`}
        >
          Clear Filters
        </button>
      </div>
    </aside>
  );
}
