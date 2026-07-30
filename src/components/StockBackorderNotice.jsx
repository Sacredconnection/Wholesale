import { Clock3 } from "lucide-react";

export default function StockBackorderNotice({ compact = false, className = "" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-2.5 rounded-sm border border-amber-300/30 bg-amber-300/10 text-amber-100 ${
        compact ? "px-3 py-2.5 text-[10px] leading-4" : "px-4 py-3 text-xs leading-relaxed"
      } ${className}`}
    >
      <Clock3 className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} mt-0.5 shrink-0 text-amber-300`} />
      <p>
        <strong className="font-black text-amber-200">Currently out of stock — available to order.</strong>{" "}
        Restocks arrive approximately once a month, so this item may take about one month
        before it is ready to ship.
      </p>
    </div>
  );
}
