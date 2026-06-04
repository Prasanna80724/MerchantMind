import { AlertTriangle, PackageX } from "lucide-react";
import Badge from "../../Badge/Badge";
import ResponseShell from "./ResponseShell";
import ShowMoreList from "./ShowMoreList";

export default function ProductListResponse({
  title,
  variant = "low_stock",
  items = [],
  allItems,
  hasMore,
  totalCount,
}) {
  const isOut = variant === "out_of_stock";
  const Icon = isOut ? PackageX : AlertTriangle;
  const subtitle =
    totalCount != null
      ? `${totalCount} product${totalCount === 1 ? "" : "s"}`
      : undefined;

  return (
    <ResponseShell
      title={title}
      subtitle={subtitle}
      icon={Icon}
      className={isOut ? "border-red-100" : "border-amber-100"}
    >
      {items.length === 0 ? (
        <p className="text-sm text-emerald-800">No products in this category.</p>
      ) : (
        <ShowMoreList
          items={items}
          allItems={allItems}
          hasMore={hasMore}
          totalCount={totalCount}
          renderItem={(item) => (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{item.name}</p>
                {item.category ? <p className="text-xs text-slate-500">{item.category}</p> : null}
              </div>
              <div className="shrink-0 text-right">
                <Badge variant={isOut ? "danger" : "warning"}>{item.quantity} in stock</Badge>
                {!isOut && item.threshold > 0 ? (
                  <p className="mt-1 text-xs text-slate-500">Threshold {item.threshold}</p>
                ) : null}
              </div>
            </div>
          )}
        />
      )}
    </ResponseShell>
  );
}
