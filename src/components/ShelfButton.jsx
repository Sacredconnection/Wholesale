"use client";

import { Bookmark, LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useShelf } from "@/components/ShelfContext";
import { shelfProductId } from "@/lib/shelf";

export default function ShelfButton({ product }) {
  const { isLoggedIn } = useAuth();
  const { isSaved, toggle, loading, saving, error } = useShelf();
  if (!isLoggedIn || !shelfProductId(product)) return null;
  const saved = isSaved(product);
  return <span className="inline-flex flex-col items-start gap-1">
    <button type="button" aria-pressed={saved} disabled={loading || saving} onClick={(event) => { event.preventDefault(); event.stopPropagation(); toggle(product); }} title="Save preferred varieties to your account and reopen them in My Shelf." className="inline-flex items-center gap-1.5 rounded border border-[#82d6c5]/25 px-2.5 py-2 text-[11px] font-semibold text-[#82d6c5] transition-colors hover:bg-[#82d6c5]/10 disabled:opacity-40">
      {saving ? <LoaderCircle size={14} className="animate-spin"/> : <Bookmark size={14} fill={saved ? "currentColor" : "none"}/>}{saved ? "Saved to My Shelf" : "Save to My Shelf"}
    </button>
    {error && <span role="status" className="max-w-xs text-[10px] text-red-200">{error}</span>}
  </span>;
}
