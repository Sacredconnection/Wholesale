"use client";

/* eslint-disable @next/next/no-img-element -- Catalog images are supplied by WooCommerce. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  History,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/components/CartContext";
import { useProducts } from "@/components/ProductsContext";
import { useAuth } from "@/components/AuthContext";
import {
  ensureWholesaleMinimum,
  findCatalogProduct,
  findOptionIndex,
  isStockedOption,
  mapWithClientConcurrency,
  preferredStockedOptionIndex,
  rankHistoricalItems,
  recipeScore,
  SUGGESTED_BLEND_RECIPES,
} from "@/lib/order-suggestions";

const RECIPE_LINE_COUNT = 4;
const RECIPE_CANDIDATE_COUNT = 6;

const uniqueById = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const variedCandidates = (products, recipe) => {
  const sorted = [...products]
    .map((product) => ({ product, score: recipeScore(product, recipe) }))
    .filter(({ score }) => recipe.terms.length === 0 || score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        String(a.product.category).localeCompare(String(b.product.category)) ||
        a.product.name.localeCompare(b.product.name)
    )
    .map(({ product }) => product);

  const source =
    recipe.strict || sorted.length >= RECIPE_LINE_COUNT ? sorted : products;
  const diverse = [];
  const usedGroups = new Set();
  for (const product of source) {
    const group = `${product.category || ""}:${product.tribe || ""}`.toLowerCase();
    if (usedGroups.has(group)) continue;
    usedGroups.add(group);
    diverse.push(product);
    if (diverse.length === RECIPE_CANDIDATE_COUNT) break;
  }
  return uniqueById([...diverse, ...source]).slice(0, RECIPE_CANDIDATE_COUNT);
};

const orderWeightLabel = (grams) =>
  grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`;

function SuggestedOrderCard({
  blend,
  personalized = false,
  isAdded,
  onAdd,
  canOrder,
}) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border ${
        personalized
          ? "border-[#82d6c5]/35 bg-[#102c27]"
          : "border-white/10 bg-[#171717]"
      }`}
    >
      <div className="border-b border-white/10 p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#82d6c5]">
            {blend.eyebrow}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-200">
            <PackageCheck className="h-3 w-3" aria-hidden="true" />
            In-stock only
          </span>
        </div>
        <h3 className="font-headline-md text-xl font-bold text-white">{blend.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{blend.description}</p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-col gap-3">
          {blend.selections.map(({ product, optionIndex, quantity }) => {
            const option = product.options[optionIndex];
            return (
              <div key={`${product.id}:${option.sku}`} className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[#268072]">
                      <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{product.name}</p>
                  <p className="mt-0.5 truncate text-[9px] text-white/40">
                    {option.name} · {option.weightGrams || 0}g
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-white/65">
                  ×{quantity}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <span className="block text-[8px] font-bold uppercase tracking-wider text-white/35">
              Suggested order
            </span>
            <strong className="text-sm text-white">
              {blend.selections.length} products · {orderWeightLabel(blend.totalWeight)}
            </strong>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-sm border-0 px-4 py-3 text-[9px] font-black uppercase tracking-wider text-white transition-colors ${
              isAdded ? "bg-[#268072]" : "bg-[#EC2300] hover:bg-[#c51d00]"
            }`}
          >
            {isAdded ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
            )}
            {isAdded
              ? "Added"
              : canOrder
                ? "Add order sheet"
                : "Sign in to order"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function SuggestedBlends({
  orders: providedOrders,
  onRequireLogin,
}) {
  const {
    products,
    loading: productsLoading,
    error: productsError,
    reload: reloadProducts,
    resolveProduct,
  } = useProducts();
  const { isLoggedIn, user } = useAuth();
  const { addSelectionsToCart, setIsCartOpen } = useCart();
  const [fetchedOrders, setFetchedOrders] = useState([]);
  const [blends, setBlends] = useState([]);
  const [personalizedBlend, setPersonalizedBlend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedBlendId, setAddedBlendId] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const preparedKeyRef = useRef("");
  const mountedRef = useRef(true);
  const orders = providedOrders ?? fetchedOrders;

  useEffect(() => {
    if (providedOrders !== undefined || !isLoggedIn) return;
    let active = true;

    async function loadOrderHistory() {
      try {
        const response = await fetch("/api/orders", {
          credentials: "same-origin",
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({}));
        if (active && response.ok) {
          setFetchedOrders(Array.isArray(data.orders) ? data.orders : []);
        }
      } catch {
        // Curated in-stock blends remain useful when history is unavailable.
      }
    }

    loadOrderHistory();
    return () => {
      active = false;
    };
  }, [isLoggedIn, providedOrders]);

  const historyItems = useMemo(() => rankHistoricalItems(orders), [orders]);
  const catalogKey = useMemo(
    () => products.map((product) => product.id).sort().join("|"),
    [products]
  );
  const historyKey = useMemo(
    () => orders.map((order) => order.id).join("|"),
    [orders]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (productsLoading) return;
    const catalogProducts = products;
    if (!catalogProducts.length) return;

    const preparationKey =
      `${isLoggedIn ? "partner" : "public"}:${user?.role || "none"}:` +
      `${user?.discountRate || 0}:${catalogKey}:${historyKey}:${retryKey}`;
    if (preparedKeyRef.current === preparationKey) return;
    preparedKeyRef.current = preparationKey;

    async function prepareBlends() {
      setLoading(true);
      setError("");

      try {
        const availableProductSummaries = catalogProducts
          .filter((product) => product.inStock !== false)
          .sort((a, b) => a.name.localeCompare(b.name));
        const candidatesByRecipe = new Map(
          SUGGESTED_BLEND_RECIPES.map((recipe) => [
            recipe.id,
            variedCandidates(availableProductSummaries, recipe),
          ])
        );
        const historicalProducts = historyItems
          .slice(0, 10)
          .map((item) => findCatalogProduct(catalogProducts, item, item.storeId))
          .filter(Boolean);
        const candidates = uniqueById([
          ...[...candidatesByRecipe.values()].flat(),
          ...historicalProducts,
        ]);

        const resolvedResults = await mapWithClientConcurrency(
          candidates,
          4,
          async (product) => {
            try {
              const resolved = await resolveProduct(product);
              return [product.id, resolved];
            } catch {
              return [product.id, null];
            }
          }
        );
        const resolvedById = new Map(resolvedResults);

        const nextBlends = SUGGESTED_BLEND_RECIPES.flatMap((recipe) => {
          const selections = (candidatesByRecipe.get(recipe.id) || [])
            .flatMap((product) => {
              const resolved = resolvedById.get(product.id);
              if (!resolved) return [];
              const optionIndex = preferredStockedOptionIndex(
                resolved,
                recipe.preferredWeight
              );
              return optionIndex >= 0
                ? [{ product: resolved, optionIndex, quantity: 1 }]
                : [];
            })
            .slice(0, RECIPE_LINE_COUNT);
          if (selections.length < 2) return [];
          const weighted = ensureWholesaleMinimum(selections, user);
          return weighted.meetsMinimum
            ? [{ ...recipe, ...weighted }]
            : [];
        });

        const personalizedSelections = historyItems
          .flatMap((item) => {
            const summary = findCatalogProduct(catalogProducts, item, item.storeId);
            const resolved = summary ? resolvedById.get(summary.id) : null;
            if (!resolved) return [];
            const optionIndex = findOptionIndex(resolved, item);
            const option = resolved.options?.[optionIndex];
            if (optionIndex < 0 || !isStockedOption(option)) return [];
            const requestedQuantity = Math.max(1, item.suggestedQuantity);
            const quantity =
              option.stockQuantity == null
                ? requestedQuantity
                : Math.min(requestedQuantity, Number(option.stockQuantity));
            return quantity > 0
              ? [{ product: resolved, optionIndex, quantity }]
              : [];
          })
          .slice(0, 5);
        const weightedPersonalized =
          personalizedSelections.length > 0
            ? ensureWholesaleMinimum(personalizedSelections, user)
            : null;

        if (
          !mountedRef.current ||
          preparedKeyRef.current !== preparationKey
        ) {
          return;
        }
        setBlends(nextBlends);
        setPersonalizedBlend(
          weightedPersonalized?.meetsMinimum
            ? {
                id: "history-based",
                title: "Your Smart Restock",
                eyebrow: "Based on your order history",
                description:
                  "Your most frequently reordered items, adjusted to current availability and the wholesale minimum.",
                ...weightedPersonalized,
              }
            : null
        );
      } catch (loadError) {
        if (
          mountedRef.current &&
          preparedKeyRef.current === preparationKey
        ) {
          setError(loadError.message || "Suggested orders could not be prepared.");
        }
      } finally {
        if (
          mountedRef.current &&
          preparedKeyRef.current === preparationKey
        ) {
          setLoading(false);
        }
      }
    }

    prepareBlends();
  }, [
    catalogKey,
    historyItems,
    historyKey,
    isLoggedIn,
    products,
    productsLoading,
    resolveProduct,
    retryKey,
    user,
  ]);

  const addBlend = (blend) => {
    if (!isLoggedIn) {
      onRequireLogin?.();
      return;
    }
    const stockedSelections = blend.selections.filter(({ product, optionIndex }) =>
      isStockedOption(product.options?.[optionIndex])
    );
    if (stockedSelections.length !== blend.selections.length) {
      setError("Availability changed. Refresh the suggestions before adding this order.");
      return;
    }
    addSelectionsToCart(stockedSelections);
    setAddedBlendId(blend.id);
    setIsCartOpen(true);
  };

  if (error || productsError) {
    return (
      <div className="rounded-xl border border-red-300/20 bg-red-400/10 p-6">
        <p className="text-sm font-bold text-red-100">
          {error || productsError}
        </p>
        <button
          type="button"
          onClick={() => {
            preparedKeyRef.current = "";
            setRetryKey((value) => value + 1);
            if (productsError) reloadProducts();
          }}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-sm border border-red-200/20 bg-transparent px-4 py-2.5 text-[9px] font-bold uppercase tracking-wider text-red-100"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }

  if (!productsLoading && products.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
        <p className="text-sm font-bold text-white">No products are available for suggestions.</p>
        <p className="mt-2 text-xs text-white/45">
          Suggested orders will appear when the live catalog has available products.
        </p>
      </div>
    );
  }

  if (loading || productsLoading) {
    return (
      <div
        role="status"
        className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-white/10 bg-[#1a1a1a] p-8 text-center"
      >
        <LoaderCircle className="h-9 w-9 animate-spin text-[#82d6c5]" aria-hidden="true" />
        <p className="mt-4 text-sm font-bold text-white">Building current suggestions</p>
        <p className="mt-1 text-xs text-white/45">
          Checking live options and removing anything unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="rounded-xl border border-[#82d6c5]/25 bg-[#102c27] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#82d6c5]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Suggested Blends
            </span>
            <h2 className="mt-2 font-headline-md text-2xl font-bold text-white md:text-3xl">
              Ready-to-build wholesale order sheets
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Each template is rebuilt from live catalog availability. Only in-stock
              options are included, and nothing enters your cart until you choose it.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-emerald-200">
            <PackageCheck className="h-4 w-4" aria-hidden="true" />
            Availability checked
          </span>
        </div>
      </div>

      {personalizedBlend && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-headline-md text-lg font-bold text-white">
            <History className="h-5 w-5 text-[#82d6c5]" aria-hidden="true" />
            Suggested from your history
          </h2>
          <SuggestedOrderCard
            blend={personalizedBlend}
            personalized
            isAdded={addedBlendId === personalizedBlend.id}
            onAdd={() => addBlend(personalizedBlend)}
            canOrder={isLoggedIn}
          />
        </section>
      )}

      <section>
        <h2 className="mb-4 font-headline-md text-lg font-bold text-white">
          Curated assortments
        </h2>
        {blends.length > 0 ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {blends.map((blend) => (
              <SuggestedOrderCard
                key={blend.id}
                blend={blend}
                isAdded={addedBlendId === blend.id}
                onAdd={() => addBlend(blend)}
                canOrder={isLoggedIn}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
            <p className="text-sm font-bold text-white">No complete blend is available right now.</p>
            <p className="mt-2 text-xs text-white/45">
              Suggested orders return automatically as qualifying products are restocked.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
