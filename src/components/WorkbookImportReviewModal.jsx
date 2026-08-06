"use client";

/* eslint-disable @next/next/no-img-element -- Product media comes from runtime WooCommerce URLs. */

import { useMemo, useRef, useState } from "react";
import { Check, FileSpreadsheet, Layers3, Minus, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";
import {
  maximumOrderQuantityForWeight,
  needsBackorder,
  optionPriceForUser,
  quantityStepForWeight,
} from "@/lib/pricing";

export default function WorkbookImportReviewModal({
  selections,
  user,
  existingCart,
  replacesExistingOrder,
  onClose,
  onConfirm,
}) {
  const [items, setItems] = useState(selections);
  const [importMode, setImportMode] = useState(replacesExistingOrder ? "add" : "replace");
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useDialogAccessibility(true, onClose, {
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
  });

  const totals = useMemo(() => {
    const units = items.reduce((sum, item) => sum + item.quantity, 0);
    const value = items.reduce((sum, item) => {
      const option = item.product.options?.[item.optionIndex];
      const price = optionPriceForUser(option, user, item.product.category);
      return sum + (price == null ? 0 : price * item.quantity);
    }, 0);
    return { units, value };
  }, [items, user]);

  const changeQuantity = (itemIndex, direction) => {
    setItems((current) => current.map((item, index) => {
      if (index !== itemIndex) return item;
      const option = item.product.options?.[item.optionIndex];
      const step = quantityStepForWeight(option?.weightGrams);
      const maximum = maximumOrderQuantityForWeight(option?.weightGrams);
      return {
        ...item,
        quantity: Math.min(maximum, Math.max(step, item.quantity + direction * step)),
      };
    }));
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#071d19]/90 p-3 backdrop-blur-md sm:p-5"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="workbook-review-title"
        aria-describedby="workbook-review-description"
        tabIndex={-1}
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-sm border border-[#82d6c5]/20 bg-[#102c27] shadow-[0_32px_90px_rgba(0,0,0,0.55)] sm:max-h-[calc(100dvh-2.5rem)]"
      >
        <header className="relative shrink-0 border-b border-white/10 px-5 py-5 pr-16 sm:px-8 sm:py-7 sm:pr-20">
          <div className="absolute inset-y-0 left-0 w-1 bg-[#82d6c5]" aria-hidden="true" />
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#82d6c5]">
            Excel order · review before import
          </p>
          <h2 id="workbook-review-title" className="mt-2 font-headline-md text-2xl font-black tracking-tight text-white sm:text-3xl">
            Check your order lines
          </h2>
          <p id="workbook-review-description" className="mt-2 max-w-2xl font-body-md text-sm leading-relaxed text-white/60">
            Adjust pack quantities or remove anything you do not want. Nothing enters your order sheet until you confirm.
          </p>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close Excel import review"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#82d6c5] sm:right-7 sm:top-7"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
          {replacesExistingOrder && (
            <fieldset className="mb-5">
              <legend className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                How should this file enter your order?
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`group flex cursor-pointer gap-4 rounded-sm border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#82d6c5] ${importMode === "add" ? "border-[#82d6c5]/65 bg-[#268072]/20" : "border-white/10 bg-white/[0.025] hover:border-white/25"}`}>
                  <input type="radio" name="workbook-import-mode" value="add" checked={importMode === "add"} onChange={() => setImportMode("add")} className="sr-only" />
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${importMode === "add" ? "border-[#82d6c5]/50 bg-[#82d6c5]/10 text-[#82d6c5]" : "border-white/10 text-white/40"}`}><Layers3 className="h-4 w-4" aria-hidden="true" /></span>
                  <span>
                    <strong className="block font-headline-md text-sm text-white">Add to current order</strong>
                    <span className="mt-1 block text-xs leading-relaxed text-white/50">Keep your order and add these quantities. Matching lines are combined.</span>
                  </span>
                </label>
                <label className={`group flex cursor-pointer gap-4 rounded-sm border p-4 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#82d6c5] ${importMode === "replace" ? "border-[#EC2300]/65 bg-[#EC2300]/10" : "border-white/10 bg-white/[0.025] hover:border-white/25"}`}>
                  <input type="radio" name="workbook-import-mode" value="replace" checked={importMode === "replace"} onChange={() => setImportMode("replace")} className="sr-only" />
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${importMode === "replace" ? "border-[#EC2300]/50 bg-[#EC2300]/10 text-[#ff765f]" : "border-white/10 text-white/40"}`}><RefreshCw className="h-4 w-4" aria-hidden="true" /></span>
                  <span>
                    <strong className="block font-headline-md text-sm text-white">Replace current order</strong>
                    <span className="mt-1 block text-xs leading-relaxed text-white/50">Remove every current line and use only the products reviewed below.</span>
                  </span>
                </label>
              </div>
            </fieldset>
          )}

          {items.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center border border-dashed border-white/15 bg-white/[0.025] px-6 text-center">
              <FileSpreadsheet className="h-8 w-8 text-[#82d6c5]" aria-hidden="true" />
              <h3 className="mt-4 font-headline-md text-lg font-bold text-white">No lines left to import</h3>
              <p className="mt-2 max-w-sm text-sm text-white/50">Close this review and choose the Excel file again to restore its products.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {items.map((item, index) => {
                const option = item.product.options?.[item.optionIndex];
                const step = quantityStepForWeight(option?.weightGrams);
                const price = optionPriceForUser(option, user, item.product.category);
                const storeId = item.product.storeId || "sacred-connection";
                const currentQuantity = importMode === "add"
                  ? existingCart.find(
                    (cartItem) => cartItem.storeId === storeId && cartItem.sku === option?.sku
                  )?.quantity || 0
                  : 0;
                const requiresBackorder = needsBackorder(
                  option,
                  currentQuantity + item.quantity
                );
                const atMaximum =
                  item.quantity + step > maximumOrderQuantityForWeight(option?.weightGrams);
                return (
                  <li key={`${item.product.storeId || "sacred-connection"}:${option?.sku}`} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="flex min-w-0 gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-[#183b35] sm:h-20 sm:w-20">
                        {item.product.image ? (
                          <img src={item.product.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg font-black text-[#82d6c5]">SC</div>
                        )}
                      </div>
                      <div className="min-w-0 self-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#82d6c5]">{item.product.category || "Wholesale"}</p>
                        <h3 className="mt-1 truncate font-headline-md text-base font-bold text-white sm:text-lg">{item.product.name}</h3>
                        <p className="mt-1 text-xs text-white/55">{option?.name}</p>
                        <p className="mt-1 break-all font-mono text-[10px] text-white/35">SKU {option?.sku || "unavailable"}</p>
                        {requiresBackorder && (
                          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                            Includes units awaiting restock
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <div className="mr-1 text-left sm:text-right">
                        <span className="block font-mono text-[9px] uppercase tracking-wider text-white/35">Line total</span>
                        <strong className="font-mono text-sm text-white">{price == null ? "—" : `$${(price * item.quantity).toFixed(2)}`}</strong>
                      </div>
                      <div className="flex h-11 items-center rounded-sm border border-white/15 bg-black/20">
                        <button
                          type="button"
                          onClick={() => changeQuantity(index, -1)}
                          disabled={item.quantity <= step}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                          className="flex h-full w-10 items-center justify-center text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <output aria-live="polite" className="w-12 text-center font-mono text-sm font-bold text-white">{item.quantity}</output>
                        <button
                          type="button"
                          onClick={() => changeQuantity(index, 1)}
                          disabled={atMaximum}
                          aria-label={`Increase quantity of ${item.product.name}`}
                          className="flex h-full w-10 items-center justify-center text-white/60 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        aria-label={`Remove ${item.product.name} from import`}
                        className="flex h-11 w-11 items-center justify-center rounded-sm border border-white/10 text-white/35 transition-colors hover:border-[#EC2300]/40 hover:bg-[#EC2300]/10 hover:text-[#ff765f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#82d6c5]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <footer className="grid shrink-0 gap-4 border-t border-white/10 bg-[#0c2521] px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8 sm:py-5">
          <div className="flex gap-6">
            <div><span className="block font-mono text-[9px] uppercase tracking-wider text-white/35">Product lines</span><strong className="font-mono text-lg text-white">{items.length}</strong></div>
            <div><span className="block font-mono text-[9px] uppercase tracking-wider text-white/35">Total units</span><strong className="font-mono text-lg text-white">{totals.units}</strong></div>
            <div><span className="block font-mono text-[9px] uppercase tracking-wider text-white/35">Estimated total</span><strong className="font-mono text-lg text-[#82d6c5]">${totals.value.toFixed(2)}</strong></div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-sm border border-white/15 px-5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/5 sm:flex-none">Cancel</button>
            <button
              type="button"
              onClick={() => onConfirm(items, importMode)}
              disabled={items.length === 0}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-sm bg-[#EC2300] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#c51d00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#82d6c5] disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              {importMode === "add" ? "Add" : "Replace with"} {items.length} {items.length === 1 ? "line" : "lines"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
