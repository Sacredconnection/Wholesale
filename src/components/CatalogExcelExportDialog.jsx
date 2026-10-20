"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import FilterSidebar from "@/components/catalog/FilterSidebar";
import { exportCatalogExcel } from "@/lib/catalog-export";
import { getCatalogTaxonomy, groupCatalogProducts, normalizeCatalogText } from "@/lib/catalog-taxonomy";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

const emptyFilters = { search: "", category: "All", tribe: "All" };
const buttonClass = "rounded-sm border border-[#82d6c5]/40 px-4 py-3 text-sm font-bold text-[#82d6c5] disabled:opacity-40";

export default function CatalogExcelExportDialog({ user, initialFilters, loadProducts, onClose }) {
  const [filters, setFilters] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [retry, setRetry] = useState(0);
  const loader = useRef(loadProducts);
  const dialogRef = useRef(null);
  const headingRef = useRef(null);
  const exportLock = useRef(false);
  useDialogAccessibility(true, () => { if (!exportLock.current) onClose(); }, { containerRef: dialogRef });
  useEffect(() => { headingRef.current?.focus(); }, [step]);
  useEffect(() => {
    let active = true;
    loader.current().then((loaded) => {
      if (active) setProducts(loaded);
    }).catch((failure) => {
      if (active) setError(failure.message || "The catalog could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  const groups = groupCatalogProducts(products);
  const selected = products.filter((product) => {
    const taxonomy = getCatalogTaxonomy(product);
    const term = normalizeCatalogText(filters.search);
    return (filters.category === "All" || taxonomy.mainCategory === filters.category)
      && (filters.tribe === "All" || taxonomy.subcategory === filters.tribe)
      && (!term || [product.name, product.sku, ...(product.options || []).map((option) => option.sku)].some((value) => normalizeCatalogText(value).includes(term)));
  });
  const summary = [filters.search && `Search: ${filters.search}`, filters.category !== "All" && `Category: ${filters.category}`, filters.tribe !== "All" && `Product type: ${filters.tribe}`].filter(Boolean).join(" | ") || "Complete catalog";

  async function download() {
    if (exportLock.current || !selected.length) return;
    exportLock.current = true;
    setBusy(true);
    setError("");
    try {
      await exportCatalogExcel({ products: selected, user, filterLabel: summary });
      setStep(2);
    } catch (failure) {
      setError(failure.message || "The spreadsheet could not be generated. Please try again.");
    } finally {
      exportLock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="excel-export-title" className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#191919] text-white shadow-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div><h2 id="excel-export-title" className="text-xl font-bold">Export Order Excel</h2><p className="mt-1 text-sm text-white/60">Choose filters, review your selection, then download.</p></div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close Excel export" className="p-2 disabled:opacity-40"><X aria-hidden="true" /></button>
        </header>
        <ol aria-label="Export steps" className="flex flex-wrap gap-4 border-b border-white/10 p-5 text-sm">
          {["Filters", "Review", "Download"].map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={step === index ? "font-bold text-[#82d6c5]" : "text-white/50"}>{index + 1}. {label}</li>)}
        </ol>
        <div className="overflow-y-auto p-5">
          <h3 ref={headingRef} tabIndex={-1} className="mb-4 text-lg font-bold">{["Choose your filters", "Review your workbook", "Your download has started"][step]}</h3>
          {error && <p role="alert" className="mb-4 text-red-300">{error}</p>}
          {loading ? <p role="status">Loading your account catalog…</p> : !products.length ? <button type="button" className={buttonClass} onClick={() => { setLoading(true); setError(""); setRetry((value) => value + 1); }}>Retry loading catalog</button> : step === 0 ? <>
            <FilterSidebar filters={filters} categories={groups.map((group) => group.name)} tribes={groups.find((group) => group.name === filters.category)?.subcategories.map((group) => group.name) || []} allValue="All" onChange={(changes) => setFilters((current) => ({ ...current, ...changes }))} onClear={() => setFilters(emptyFilters)} />
            <p role="status" className="mt-4 text-sm text-[#82d6c5]">{selected.length} products selected</p>
            <button type="button" className={`${buttonClass} mt-3`} onClick={() => setFilters(emptyFilters)}>Use complete catalog</button>
          </> : step === 1 ? <>
            <p className="text-sm text-white/70">{summary}</p>
            <p className="my-4 font-bold">{selected.length} products selected</p>
            <ul className="space-y-2 text-sm">{groupCatalogProducts(selected).map((group) => <li key={group.name}>{group.name}: {group.subcategories.reduce((total, sub) => total + sub.products.length, 0)} products</li>)}</ul>
            <p className="mt-4 text-sm text-white/60">The workbook includes your account prices and a quantity column. Fill in quantities, then use Import Order Excel to review your order.</p>
          </> : <p className="text-sm text-white/70">Fill in quantities in the downloaded workbook, then import it to review your order.</p>}
        </div>
        <footer className="flex justify-between gap-3 border-t border-white/10 p-5">
          <button type="button" className={buttonClass} disabled={busy} onClick={() => step > 0 ? setStep(step - 1) : onClose()}>{step > 0 ? "Back" : "Cancel"}</button>
          {step === 0 ? <button type="button" className={buttonClass} disabled={loading || !selected.length} onClick={() => setStep(1)}>Review selection</button> : step === 1 ? <button type="button" className={buttonClass} disabled={busy || !selected.length} onClick={download}>{busy ? "Preparing Excel…" : "Download Excel"}</button> : <button type="button" className={buttonClass} onClick={onClose}>Done</button>}
        </footer>
      </section>
    </div>
  );
}
