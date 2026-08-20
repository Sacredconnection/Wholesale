"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag, X } from "lucide-react";
import StockBackorderNotice from "@/components/StockBackorderNotice";
import { useDialogAccessibility } from "@/lib/use-dialog-accessibility";
import {
  maximumOrderQuantityForWeight,
  isValidQuantityForWeight,
  needsBackorder,
  normalizeQuantityForWeight,
  orderableStockQuantity,
  optionPriceForUser,
  quantityStepForWeight,
} from "@/lib/pricing";

export default function ProductOptionsModal({ product, user, onClose, onAddToCart }) {
  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useDialogAccessibility(Boolean(product), onClose, {
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
  });

  useEffect(() => {
    if (!product) return undefined;
    let cancelled = false;

    async function loadOptions() {
      try {
        const response = await fetch(`/api/products/${encodeURIComponent(product.id)}`, {
          credentials: "same-origin",
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load product options.");
        if (!cancelled) {
          setResolvedProduct(data.product);
          setSelectedOptionIndex(0);
          setQuantity(String(
            quantityStepForWeight(data.product.options?.[0]?.weightGrams)
          ));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.name === "TimeoutError"
            ? "The product options took too long to load. Please close and try again."
            : loadError.message);
        }
      }
    }

    loadOptions();
    return () => { cancelled = true; };
  }, [product]);

  if (!product) return null;

  const selectedOption = resolvedProduct?.options[selectedOptionIndex];
  const quantityStep = quantityStepForWeight(selectedOption?.weightGrams);
  const availableQuantity = orderableStockQuantity(selectedOption);
  const maximumQuantity = maximumOrderQuantityForWeight(selectedOption?.weightGrams);
  const numericQuantity = Number(quantity);
  const isQuantityValid =
    isValidQuantityForWeight(numericQuantity, selectedOption?.weightGrams) &&
    numericQuantity <= maximumQuantity;
  const canIncreaseQuantity =
    isQuantityValid && numericQuantity + quantityStep <= maximumQuantity;
  const requiresBackorder = needsBackorder(
    selectedOption,
    isQuantityValid ? numericQuantity : 0
  );
  const price = selectedOption
    ? optionPriceForUser(selectedOption, user, resolvedProduct.category)
    : null;
  const minimumPackTotal =
    price == null ? null : price * quantityStep;
  const selectedTotal =
    price == null || !isQuantityValid ? null : price * numericQuantity;
  const canAdd = Boolean(selectedOption && isQuantityValid);

  const changeQuantity = (direction) => {
    const baseQuantity = isQuantityValid ? numericQuantity : 0;
    const nextQuantity = Math.min(
      maximumQuantity,
      Math.max(quantityStep, baseQuantity + direction * quantityStep)
    );
    setQuantity(String(nextQuantity));
  };

  const normalizeQuantity = () => {
    if (isQuantityValid) return;
    const normalized = Math.min(
      maximumQuantity,
      normalizeQuantityForWeight(numericQuantity, selectedOption?.weightGrams)
    );
    setQuantity(String(normalized));
  };

  const handleAdd = () => {
    if (resolvedProduct && selectedOption && canAdd) {
      onAddToCart(resolvedProduct, selectedOptionIndex, numericQuantity);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-[#0c0c0c]/85 p-3 backdrop-blur-md sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-options-title"
        tabIndex={-1}
        className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-[#1a1a1a] p-5 shadow-2xl sm:p-7"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close product options"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/60 transition-colors hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-12">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#82d6c5]">Select variation</span>
          <h2 id="product-options-title" className="mt-1 text-xl font-bold text-white font-headline-md">{product.name}</h2>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-white/40">{product.storeName}</p>
        </div>

        {!resolvedProduct && !error && (
          <div role="status" className="flex items-center justify-center gap-3 py-12 text-sm text-white/60">
            <Loader2 className="h-5 w-5 animate-spin text-[#82d6c5]" />
            Loading available options...
          </div>
        )}

        {error && (
          <div role="alert" className="mt-6 rounded border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>
        )}

        {resolvedProduct && (
          <div className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="modal-product-option" className="text-[10px] font-mono uppercase tracking-wider text-white/50">Available option</label>
              <select
                id="modal-product-option"
                value={selectedOptionIndex}
                onChange={(event) => {
                  const nextIndex = Number(event.target.value);
                  setSelectedOptionIndex(nextIndex);
                  setQuantity(String(
                    quantityStepForWeight(
                      resolvedProduct.options[nextIndex]?.weightGrams
                    )
                  ));
                }}
                className="w-full rounded-sm border border-white/10 bg-[#101010] px-4 py-3 text-sm text-white outline-none focus:border-[#268072]"
              >
                {resolvedProduct.options.map((option, index) => (
                  <option key={`${option.wcVariationId || option.sku}-${index}`} value={index}>
                    {option.name} (${optionPriceForUser(option, user, resolvedProduct.category).toFixed(2)})
                    {option.inStock === false ? " · Out of stock" : ""}
                  </option>
                ))}
              </select>
            </div>

            {requiresBackorder && <StockBackorderNotice />}
            {quantityStep > 1 && selectedOption && (
              <p className="text-[10px] font-semibold text-[#82d6c5]">
                This {Math.round(selectedOption.weightGrams)}g tin is sold in
                multiples of {quantityStep} units.
                {availableQuantity != null && ` ${availableQuantity / quantityStep} ${availableQuantity / quantityStep === 1 ? "pack" : "packs"} available now; additional packs can be requested for restock.`}
              </p>
            )}

            <div className="flex flex-wrap items-end justify-between gap-4 rounded border border-white/5 bg-black/20 p-4">
              <div className="flex flex-wrap items-end gap-5">
                <div>
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">Unit price</span>
                  <strong className="text-xl text-white">${price?.toFixed(2)}</strong>
                </div>
                {quantityStep > 1 && minimumPackTotal != null && (
                  <div className="border-l border-white/10 pl-5">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-white/40">
                      Pack of {quantityStep}
                    </span>
                    <strong className="text-2xl text-[#82d6c5]">
                      ${minimumPackTotal.toFixed(2)}
                    </strong>
                  </div>
                )}
              </div>
              <div className="flex items-center rounded-sm border border-white/10 bg-[#101010]">
                <button type="button" onClick={() => changeQuantity(-1)} className="cursor-pointer border-0 bg-transparent p-3 text-white/60 hover:text-white" aria-label="Decrease quantity"><Minus className="h-4 w-4" /></button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  role="spinbutton"
                  value={quantity}
                  onChange={(event) => {
                    if (/^\d*$/.test(event.target.value)) {
                      setQuantity(event.target.value);
                    }
                  }}
                  onBlur={normalizeQuantity}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  aria-label={`Quantity of ${product.name}`}
                  aria-invalid={!isQuantityValid}
                  aria-valuemin={quantityStep}
                  aria-valuemax={maximumQuantity}
                  aria-valuenow={isQuantityValid ? numericQuantity : undefined}
                  className="w-14 border-x border-y-0 border-white/10 bg-transparent px-1 py-3 text-center text-sm font-bold text-white outline-none focus:bg-white/5 focus:ring-1 focus:ring-inset focus:ring-[#268072]"
                />
                <button type="button" onClick={() => changeQuantity(1)} disabled={!canIncreaseQuantity} className="cursor-pointer border-0 bg-transparent p-3 text-white/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-25" aria-label="Increase quantity"><Plus className="h-4 w-4" /></button>
              </div>
              {quantityStep > 1 && numericQuantity > quantityStep && selectedTotal != null && (
                <p className="w-full border-t border-white/5 pt-3 text-right text-[10px] font-semibold text-white/50">
                  {numericQuantity} units selected:{" "}
                  <strong className="text-white">${selectedTotal.toFixed(2)}</strong>
                </p>
              )}
            </div>

            <button type="button" onClick={handleAdd} disabled={!canAdd} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-sm border-0 bg-[#EC2300] px-6 py-4 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-[#c51d00] disabled:cursor-not-allowed disabled:opacity-35">
              <ShoppingBag className="h-4 w-4" />
              Add selected option
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
