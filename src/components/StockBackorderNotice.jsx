import { Clock3 } from "lucide-react";

export default function StockBackorderNotice({
  compact = false,
  className = "",
  items = [],
}) {
  const detailedItems = Array.isArray(items) ? items.filter(Boolean) : [];

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
        <strong className="block font-black text-amber-200">
          Temporarily Out of Stock
        </strong>
        <span className="block">
          Usually available again within 30 days. Contact our team for the latest availability.
        </span>
        {detailedItems.length > 0 && (
          <span className="mt-2 block">
            {detailedItems.map((item) => (
              <span key={item.key} className="mt-1 block text-amber-50">
                <strong>{item.productName}</strong>
                {item.optionName ? ` · ${item.optionName}` : ""}
                {item.sku ? ` · SKU ${item.sku}` : ""}
                {item.availableQuantity != null
                  ? ` · ${item.availableQuantity} available now / ${item.requestedQuantity} requested`
                  : ` · ${item.requestedQuantity} requested`}
              </span>
            ))}
          </span>
        )}
      </p>
    </div>
  );
}
