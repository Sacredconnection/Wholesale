"use client";

/* eslint-disable @next/next/no-img-element -- WooCommerce catalog images have runtime fallbacks. */

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, Eye, FileText, LoaderCircle, Search, X } from "lucide-react";
import { loadPdfCatalog, generateCatalogPdf, saveCatalogPdf } from "@/lib/catalog-export";
import { groupCatalogProducts, getCatalogTaxonomy, catalogProductTitle, normalizeCatalogText } from "@/lib/catalog-taxonomy";
import { getOrderableProductOptions, optionPriceForUser } from "@/lib/pricing";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";

const STEPS = ["Categories", "Products", "Review", "Your PDF"];
const productKey = (product) => `${product.storeId || "sacred-connection"}:${product.wcId || product.id || product.sku}`;
const groupKey = (main, sub) => JSON.stringify([main, sub]);
const money = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function CatalogPdfExportDialog({ user, initialCategory = "", onClose }) {
  const [step, setStep] = useState(0);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(new Set());
  const [selection, setSelection] = useState(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [artifact, setArtifact] = useState(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const headingRef = useRef(null);
  const mounted = useRef(true);
  const generationLock = useRef(false);
  const artifactUrl = useRef("");
  const seedCategory = useRef(initialCategory);
  const accountKey = user ? `${user.id}:${user.role || ""}` : "";

  useDialogAccessibility(true, () => { if (!generating) onClose(); }, {
    containerRef: dialogRef, initialFocusRef: closeRef,
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (artifactUrl.current) URL.revokeObjectURL(artifactUrl.current);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (!accountKey) throw new Error("Sign in to export your wholesale catalog.");
        const loaded = await loadPdfCatalog({ signal: controller.signal });
        if (controller.signal.aborted) return;
        const exportable = loaded.filter((product) => getOrderableProductOptions(product).length > 0);
        const matching = exportable.filter((product) => {
          const taxonomy = getCatalogTaxonomy(product);
          return [taxonomy.mainCategory, taxonomy.subcategory, product.category].includes(seedCategory.current);
        });
        const initial = matching.length ? matching : exportable;
        setProducts(exportable);
        setCategories(new Set(initial.map((product) => {
          const { mainCategory, subcategory } = getCatalogTaxonomy(product);
          return groupKey(mainCategory, subcategory);
        })));
        setSelection(new Set(initial.map(productKey)));
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message || "The catalog could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [retry, accountKey]);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const groups = useMemo(() => groupCatalogProducts(products), [products]);
  const eligible = useMemo(() => products.filter((product) => {
    const { mainCategory, subcategory } = getCatalogTaxonomy(product);
    return categories.has(groupKey(mainCategory, subcategory));
  }), [products, categories]);
  const selected = useMemo(() => eligible.filter((product) => selection.has(productKey(product))), [eligible, selection]);
  const reviewGroups = useMemo(() => groupCatalogProducts(selected), [selected]);
  const visible = useMemo(() => {
    const search = normalizeCatalogText(query);
    return eligible.filter((product) => normalizeCatalogText(`${product.name} ${product.category} ${product.tribe} ${product.sku} ${(product.options || []).map((option) => option.sku).join(" ")}`).includes(search));
  }, [eligible, query]);

  const invalidate = () => {
    if (artifactUrl.current) URL.revokeObjectURL(artifactUrl.current);
    artifactUrl.current = "";
    setArtifact(null);
    setPreview(false);
    setError("");
  };
  const selectCategories = (keys, checked) => {
    invalidate();
    setCategories((current) => {
      const next = new Set(current);
      keys.forEach((key) => checked ? next.add(key) : next.delete(key));
      return next;
    });
    if (checked) setSelection((current) => {
      const next = new Set(current);
      products.forEach((product) => {
        const { mainCategory, subcategory } = getCatalogTaxonomy(product);
        if (keys.includes(groupKey(mainCategory, subcategory))) next.add(productKey(product));
      });
      return next;
    });
  };
  const selectProducts = (items, checked) => {
    invalidate();
    setSelection((current) => {
      const next = new Set(current);
      items.forEach((product) => checked ? next.add(productKey(product)) : next.delete(productKey(product)));
      return next;
    });
  };
  const generate = async () => {
    if (!selected.length || generationLock.current) return;
    generationLock.current = true;
    setStep(3);
    setGenerating(true);
    setError("");
    setProgress({ label: "Preparing your selected products…" });
    try {
      const result = await generateCatalogPdf({
        products: selected,
        user,
        filterLabel: reviewGroups.map((group) => group.name).join(" · "),
        onProgress: (value) => { if (mounted.current) setProgress(value); },
      });
      if (!mounted.current) return;
      if (artifactUrl.current) URL.revokeObjectURL(artifactUrl.current);
      artifactUrl.current = URL.createObjectURL(result.blob);
      setArtifact({ ...result, url: artifactUrl.current });
    } catch (failure) {
      if (mounted.current) setError(failure.message || "The PDF could not be generated. Your selection has been kept.");
    } finally {
      generationLock.current = false;
      if (mounted.current) setGenerating(false);
    }
  };
  const download = async () => {
    if (!artifact || saving) return;
    setSaving(true);
    setError("");
    try { await saveCatalogPdf(artifact); }
    catch (failure) { setError(failure.message || "The PDF could not be saved. Please try again."); }
    finally { if (mounted.current) setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#071d19]/90 p-2 backdrop-blur-md sm:p-6">
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pdf-export-title" tabIndex={-1}
        className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-[#82d6c5]/25 bg-[#102c27] text-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <header className="relative shrink-0 border-b border-white/10 px-5 py-5 sm:px-8">
          <button ref={closeRef} onClick={onClose} disabled={generating} type="button" aria-label="Close PDF export" className="absolute right-4 top-4 rounded p-2 text-white/65 hover:bg-white/10 disabled:opacity-30"><X size={21}/></button>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#82d6c5]">Your wholesale catalog</p>
          <h2 id="pdf-export-title" className="mt-1 text-2xl font-bold">PDF Catalog</h2>
          <p className="mt-1 pr-7 text-sm text-white/60">Choose what to include, review your prices, then save or share your PDF.</p>
          <ol aria-label="Export steps" className="mt-5 grid grid-cols-4 gap-2">
            {STEPS.map((label, index) => <li key={label} aria-current={step === index ? "step" : undefined} className={`border-t-2 pt-2 text-xs ${step === index ? "border-[#82d6c5] text-[#82d6c5]" : index < step ? "border-[#82d6c5]/50 text-white/75" : "border-white/15 text-white/40"}`}>
              <span className="flex items-center gap-1.5">{index < step ? <Check size={14}/> : <span>{index + 1}.</span>}<span className="hidden sm:inline">{label}</span></span>
            </li>)}
          </ol>
          <p className="mt-2 text-xs text-white/60 sm:hidden">Step {step + 1} of 4 · {STEPS[step]}</p>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8">
          <h3 ref={headingRef} tabIndex={-1} className="mb-4 text-lg font-semibold outline-none">{["Choose categories", "Choose products", "Review your catalog", "Your PDF"][step]}</h3>
          {error && <div role="alert" className="mb-4 rounded border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{error}{products.length === 0 && !loading && <button type="button" className="ml-3 underline" onClick={() => setRetry((value) => value + 1)}>Try again</button>}</div>}
          {loading ? <p role="status" className="flex items-center gap-2 py-12 text-white/70"><LoaderCircle className="animate-spin" size={20}/> Loading your catalog and account prices…</p> : <>
            {step === 0 && <>
              <label className="mb-5 flex cursor-pointer items-center gap-3 rounded border border-[#82d6c5]/25 bg-[#82d6c5]/5 p-4">
                <input type="checkbox" className="h-4 w-4 accent-[#82d6c5]" checked={groups.length > 0 && groups.every((group) => group.subcategories.every((sub) => categories.has(groupKey(group.name, sub.name))))} onChange={(event) => selectCategories(groups.flatMap((group) => group.subcategories.map((sub) => groupKey(group.name, sub.name))), event.target.checked)}/>
                <span className="font-semibold">All categories <span className="ml-2 text-xs font-normal text-white/50">{products.length} products</span></span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">{groups.map((group) => <fieldset key={group.name} className="rounded border border-white/15 p-4">
                <legend className="px-1 text-sm font-semibold text-[#82d6c5]">{group.name}</legend>
                <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="accent-[#82d6c5]" checked={group.subcategories.every((sub) => categories.has(groupKey(group.name, sub.name)))} onChange={(event) => selectCategories(group.subcategories.map((sub) => groupKey(group.name, sub.name)), event.target.checked)}/> Select this category</label>
                {group.subcategories.map((sub) => <label key={sub.name} className="flex cursor-pointer items-center gap-2 border-t border-white/5 py-2 text-sm text-white/70"><input type="checkbox" className="accent-[#82d6c5]" checked={categories.has(groupKey(group.name, sub.name))} onChange={(event) => selectCategories([groupKey(group.name, sub.name)], event.target.checked)}/><span className="flex-1">{sub.name}</span><span className="text-xs text-white/40">{sub.products.length}</span></label>)}
              </fieldset>)}</div>
              {!groups.length && <p className="text-white/60">There are no products available to export.</p>}
            </>}
            {step === 1 && <>
              <label className="mb-4 flex items-center gap-2 rounded border border-white/20 bg-black/10 px-3"><Search size={17} className="text-white/40"/><input aria-label="Search products to export" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search varieties, tribes or SKU" className="w-full bg-transparent py-3 text-sm outline-none"/></label>
              <div className="mb-4 flex flex-wrap gap-4 text-xs text-[#82d6c5]"><button type="button" onClick={() => selectProducts(visible, true)}>Select all shown ({visible.length})</button><button type="button" onClick={() => selectProducts(visible, false)}>Deselect shown</button></div>
              <div className="grid gap-2 sm:grid-cols-2">{visible.map((product) => <label key={productKey(product)} className={`flex cursor-pointer items-center gap-3 rounded border p-3 ${selection.has(productKey(product)) ? "border-[#82d6c5]/45 bg-[#82d6c5]/5" : "border-white/10"}`}>
                <input type="checkbox" aria-label={`Include ${product.name}`} className="h-4 w-4 shrink-0 accent-[#82d6c5]" checked={selection.has(productKey(product))} onChange={(event) => selectProducts([product], event.target.checked)}/>
                {product.image && <img src={product.image} alt="" className="h-12 w-12 shrink-0 rounded object-cover" onError={(event) => { event.currentTarget.hidden = true; }}/>}<span className="min-w-0"><span className="block text-sm font-medium">{catalogProductTitle(product)}</span><span className="block text-xs text-white/45">{getCatalogTaxonomy(product).subcategory} · {getOrderableProductOptions(product).length} sizes / options</span></span>
              </label>)}</div>
              {!visible.length && <p className="py-6 text-sm text-white/60">No products match your search.</p>}
            </>}
            {step === 2 && <>
              <p className="mb-5 text-sm text-white/60">{selected.length} products · Your account prices in USD. Account discounts and shipping are calculated separately when you place an order.</p>
              {reviewGroups.map((group) => <section key={group.name} className="mb-6"><h4 className="mb-3 border-b border-[#82d6c5]/25 pb-2 font-semibold text-[#82d6c5]">{group.name}</h4>{group.subcategories.map((sub) => <div key={sub.name} className="mb-4"><h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-white/50">{sub.name}</h5>{sub.products.map((product) => <div key={productKey(product)} className="border-b border-white/10 py-3"><p className="text-sm font-medium">{catalogProductTitle(product)}</p><dl className="mt-2 grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">{getOrderableProductOptions(product).map((option, index) => <div key={option.sku || index} className="flex justify-between gap-3 text-white/65"><dt>{option.name}</dt><dd className="shrink-0 font-mono text-white">{money(optionPriceForUser(option, user))}</dd></div>)}</dl></div>)}</div>)}</section>)}
            </>}
            {step === 3 && <div className="py-4">
              {generating && <div role="status" aria-live="polite" className="py-10 text-center"><LoaderCircle className="mx-auto mb-4 animate-spin text-[#82d6c5]" size={36}/><p className="font-semibold">Generating your PDF…</p><p className="mt-2 text-sm text-white/60">{progress?.label}</p>{progress?.total > 0 && <progress aria-label="PDF generation progress" value={progress.completed} max={progress.total} className="mt-5 w-64 max-w-full accent-[#82d6c5]"/>}<p className="mt-4 text-xs text-white/40">Keep this window open until your PDF is ready.</p></div>}
              {artifact && <><div className="rounded border border-[#82d6c5]/25 bg-[#82d6c5]/5 p-6 text-center"><Check className="mx-auto mb-3 text-[#82d6c5]" size={30}/><p className="text-xl font-semibold">Your catalog is ready</p><p className="mt-2 text-sm text-white/60">{artifact.productCount} products · {artifact.generatedAtLabel}</p><div className="mt-5 flex flex-wrap justify-center gap-3"><button type="button" onClick={() => setPreview((value) => !value)} className="flex items-center gap-2 rounded border border-white/25 px-4 py-3 text-sm"><Eye size={17}/>{preview ? "Hide preview" : "View PDF"}</button><button type="button" disabled={saving} onClick={download} className="flex items-center gap-2 rounded bg-[#82d6c5] px-4 py-3 text-sm font-bold text-[#102c27] disabled:opacity-50"><Download size={17}/>{saving ? "Saving…" : "Download PDF"}</button></div></div>{preview && <div className="mt-5"><p className="mb-2 text-xs text-white/50">If your browser does not display the preview, use Download PDF to open it.</p><iframe title="Selected wholesale catalog PDF preview" src={artifact.url} className="h-[55dvh] w-full rounded border border-white/15 bg-white"/></div>}</>}
              {!generating && !artifact && <button type="button" onClick={generate} className="rounded bg-[#82d6c5] px-5 py-3 text-sm font-bold text-[#102c27]">Try generating again</button>}
            </div>}
          </>}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0b241f] px-5 py-4 sm:px-8">
          <span aria-live="polite" className="text-xs text-white/60">{selected.length} products selected</span>
          <div className="flex gap-2">{step > 0 && <button type="button" disabled={generating} onClick={() => { setStep(step - 1); setPreview(false); setError(""); }} className="flex items-center gap-1.5 rounded border border-white/20 px-4 py-2.5 text-sm disabled:opacity-30"><ArrowLeft size={16}/>Back</button>}
            {step < 2 && <button type="button" disabled={loading || (step === 0 ? eligible.length === 0 : selected.length === 0)} onClick={() => { setStep(step + 1); setError(""); }} className="flex items-center gap-1.5 rounded bg-[#82d6c5] px-4 py-2.5 text-sm font-bold text-[#102c27] disabled:opacity-30">Continue<ArrowRight size={16}/></button>}
            {step === 2 && <button type="button" disabled={!selected.length || generating} onClick={() => artifact ? setStep(3) : generate()} className="flex items-center gap-2 rounded bg-[#82d6c5] px-4 py-2.5 text-sm font-bold text-[#102c27] disabled:opacity-30"><FileText size={16}/>{artifact ? "View PDF" : "Generate PDF"}</button>}
            {step === 3 && artifact && <button type="button" onClick={onClose} className="rounded border border-white/20 px-4 py-2.5 text-sm">Done</button>}
          </div>
        </footer>
      </section>
    </div>
  );
}
