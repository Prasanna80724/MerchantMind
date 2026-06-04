import { MessageCircle } from "lucide-react";
import { cn } from "../../utils/cn";

export default function AssistantButton({ onClick, isOpen, lowStockCount = 0, className }) {
  const badgeLabel =
    lowStockCount > 0
      ? `${lowStockCount} product${lowStockCount !== 1 ? "s" : ""} need attention`
      : null;

  return (
    <div className={cn("fixed bottom-5 right-5 z-[45] sm:bottom-6 sm:right-6", className)}>
      {badgeLabel && !isOpen && (
        <div
          className="pointer-events-none absolute -top-2 right-14 hidden max-w-[200px] rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 shadow-md sm:block"
          role="status"
        >
          {lowStockCount} need restocking
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label={isOpen ? "Close MerchantMind Assistant" : "Open MerchantMind Assistant"}
        aria-expanded={isOpen}
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          "bg-gradient-to-br from-brand-600 to-violet-600 text-white",
          "hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2",
          isOpen && "rotate-0 scale-95"
        )}
      >
        <MessageCircle className="h-6 w-6" />
        {lowStockCount > 0 && !isOpen && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white"
            aria-hidden
          >
            {lowStockCount > 9 ? "9+" : lowStockCount}
          </span>
        )}
      </button>
    </div>
  );
}
