"use client";

import { useEffect, useState } from "react";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useCart } from "@/components/CartContext";
import { useProducts } from "@/components/ProductsContext";
import StockBackorderNotice from "@/components/StockBackorderNotice";
import {
  optionPriceForUser,
  quantityStepForWeight,
} from "@/lib/pricing";

export default function ProductPurchaseControls({
  product,
  onAdded,
  buttonLabel = "Add",
  compact = false,
}) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { resolveProduct } = useProducts();
  const [resolvedProduct, setResolvedProduct] = useState(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(() => {
    const firstAvailable = product.options?.findIndex((option) => option.inStock !== false);
    return firstAvailable >= 0 ? firstAvailable : 0;
  });
  const [quantity, setQuantity] = useState(() => {
    const firstAvailable = product.options?.find(
      (option) => option.inStock !== false
    );
    return quantityStepForWeight(
      firstAvailable?.weightGrams || product.options?.[0]?.weightGrams
    );
  });
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    if (product.optionsLoaded) {
      return undefined;
    }

    resolveProduct(product)
      .then((loadedProduct) => {
        if (cancelled) return;
        setResolvedProduct(loadedProduct);
        const firstAvailable = loadedProduct.options.findIndex(
          (option) => option.inStock !== false
        );
        const nextIndex = firstAvailable >= 0 ? firstAvailable : 0;
        setSelectedOptionIndex(nextIndex);
        setQuantity(
          quantityStepForWeight(
            loadedProduct.options[nextIndex]?.weightGrams
          )
        );
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || "Could not load product options.");
      });

    return () => {
      cancelled = true;
    };
  }, [product, resolveProduct, retryKey]);

  const activeProduct = product.optionsLoaded ? product : resolvedProduct;
  const selectedOption = activeProduct?.options[selectedOptionIndex];
  const quantityStep = quantityStepForWeight(selectedOption?.weightGrams);
  const price = selectedOption
    ? optionPriceForUser(selectedOption, user, activeProduct.category)
    : null;
  const canAdd = Boolean(selectedOption && !error);

  const handleAdd = () => {
    if (!activeProduct || !canAdd) return;
    addToCart(activeProduct, selectedOptionIndex, quantity);
    setQuantity(quantityStep);
    onAdded?.(activeProduct, selectedOptionIndex);
  };

  return (
    <div className={`flex w-full flex-col ${compact ? "gap-2.5" : "gap-3"}`}>
      <label className="flex flex-col gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">
          Product option
        </span>
        <select
          value={selectedOptionIndex}
          onChange={(event) => {
            const nextIndex = Number(event.target.value);
            setSelectedOptionIndex(nextIndex);
            setQuantity(
              quantityStepForWeight(
                activeProduct?.options[nextIndex]?.weightGrams
              )
            );
          }}
          disabled={!activeProduct || Boolean(error)}
          aria-label={`Select an option for ${product.name}`}
          className={`w-full rounded-sm border border-white/10 bg-[#131313] text-white outline-none transition-colors focus:border-[#268072] disabled:cursor-wait disabled:opacity-60 ${
            compact ? "px-2.5 py-2 text-[11px]" : "px-3 py-2.5 text-xs"
          }`}
        >
          {!activeProduct ? (
            <option>Loading options…</option>
          ) : (
            activeProduct.options.map((option, index) => (
              <option
                key={`${option.wcVariationId || option.sku}-${index}`}
                value={index}
              >
                {option.name} · ${optionPriceForUser(option, user, activeProduct.category).toFixed(2)}
                {option.inStock === false ? " · Out of stock" : ""}
              </option>
            ))
          )}
        </select>
      </label>

      {selectedOption?.inStock === false && <StockBackorderNotice compact={compact} />}
      {quantityStep > 1 && selectedOption && (
        <p className="text-[9px] font-semibold leading-relaxed text-[#82d6c5]">
          This {Math.round(selectedOption.weightGrams)}g tin is sold in multiples
          of {quantityStep} units.
        </p>
      )}

      {error ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setRetryKey((key) => key + 1);
          }}
          className="rounded-sm border border-red-300/25 bg-red-400/10 px-3 py-2 text-left text-[10px] text-red-200 transition-colors hover:bg-red-400/15"
        >
          {error} <strong className="ml-1 uppercase">Retry</strong>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block truncate text-[9px] uppercase tracking-wider text-white/35">
              {selectedOption?.sku || (activeProduct ? "SKU unavailable" : "Loading price")}
            </span>
            <strong className={`block text-[#82d6c5] ${compact ? "text-sm" : "text-base"}`}>
              {price == null ? "—" : `$${price.toFixed(2)}`}
            </strong>
          </div>

          <div className="flex shrink-0 items-center rounded-sm border border-white/10 bg-[#131313]">
            <button
              type="button"
              onClick={() =>
                setQuantity((value) =>
                  Math.max(quantityStep, value - quantityStep)
                )
              }
              aria-label={`Decrease quantity of ${product.name}`}
              className={`${compact ? "p-2" : "p-2.5"} cursor-pointer border-0 bg-transparent text-white/55 hover:text-white`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-7 text-center text-xs font-bold text-white">{quantity}</span>
            <button
              type="button"
              onClick={() =>
                setQuantity((value) => value + quantityStep)
              }
              aria-label={`Increase quantity of ${product.name}`}
              className={`${compact ? "p-2" : "p-2.5"} cursor-pointer border-0 bg-transparent text-white/55 hover:text-white`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!canAdd}
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-sm border-0 bg-[#EC2300] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#c51d00] disabled:cursor-wait disabled:opacity-45 ${
              compact ? "px-3 py-2.5 text-[9px]" : "px-4 py-3 text-[10px]"
            }`}
          >
            {!activeProduct ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" />
            )}
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
}
