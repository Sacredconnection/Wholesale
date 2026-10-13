"use client";

import { useState } from "react";
import { ChevronDown, Filter, Search } from "lucide-react";

export default function FilterSidebar({ filters, categories = [], categoryGroups = [], tribes = [], onChange, onClear, disabled = false, allValue = "" }) {
  const [expanded, setExpanded] = useState(true);
  const groups = categoryGroups.length ? categoryGroups : categories.map((name) => ({
    name,
    subcategories: name === filters.category ? tribes.map((name) => ({ name })) : [],
  }));
  const select = (category, tribe = allValue) => onChange({ ...filters, category, tribe });
  return (
    <aside className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white"><Filter className="h-4 w-4 text-[#82d6c5]" aria-hidden="true" />Filter products</h2>
        <button type="button" onClick={onClear} disabled={disabled} className="text-xs font-semibold text-[#82d6c5] underline disabled:opacity-40">Clear filters</button>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="catalog-search" className="sr-only">Search by name or SKU</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
          <input id="catalog-search" type="search" value={filters.search || ""} onChange={(event) => onChange({ ...filters, search: event.target.value })} placeholder="Name or SKU..." disabled={disabled} className="w-full rounded-sm border border-white/15 bg-[#131313] py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-[#82d6c5] disabled:opacity-40" />
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="catalog-category-choices" className="inline-flex items-center justify-between gap-6 rounded-sm border border-white/15 bg-[#131313] px-4 py-3 text-sm text-white">
          All categories <ChevronDown className={expanded ? "h-4 w-4 rotate-180" : "h-4 w-4"} aria-hidden="true" />
        </button>
      </div>
      {filters.category !== allValue && <p className="mt-3 text-xs text-white/60">Showing: {filters.category}{filters.tribe !== allValue ? " / " + filters.tribe : ""}</p>}
      {expanded && <div id="catalog-category-choices" className="mt-4 border-t border-white/10 pt-4">
        <button type="button" onClick={() => select(allValue)} disabled={disabled} aria-pressed={filters.category === allValue} className={"mb-4 rounded-sm border px-3 py-2 text-xs font-bold " + (filters.category === allValue ? "border-[#82d6c5]/60 bg-[#268072]/25 text-[#82d6c5]" : "border-white/15 text-white/65")}>Show all products</button>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => <div key={group.name}>
            <button type="button" onClick={() => select(group.name)} disabled={disabled} aria-pressed={filters.category === group.name && filters.tribe === allValue} className={"mb-2 text-left text-sm font-bold " + (filters.category === group.name ? "text-[#82d6c5]" : "text-white")}>{group.name}</button>
            <div className="flex flex-wrap gap-1.5">
              {group.subcategories.filter((child) => child.name !== group.name).map((child) => <button key={child.name} type="button" onClick={() => select(group.name, child.name)} disabled={disabled} aria-pressed={filters.category === group.name && filters.tribe === child.name} className={"rounded-sm border px-2.5 py-1.5 text-xs " + (filters.category === group.name && filters.tribe === child.name ? "border-[#82d6c5]/60 bg-[#268072]/25 text-[#82d6c5]" : "border-white/10 text-white/60 hover:border-white/30 hover:text-white")}>{child.name}</button>)}
            </div>
          </div>)}
        </div>
      </div>}
    </aside>
  );
}
