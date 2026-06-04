import { IndianRupee, Receipt } from "lucide-react";
import { formatCurrency } from "../../../utils/currency";
import ResponseShell from "./ResponseShell";
import ShowMoreList from "./ShowMoreList";

export default function RevenueResponse({
  title,
  amount,
  items = [],
  allItems,
  hasMore,
  totalCount,
  listMode,
}) {
  const showList = listMode === "sales" && items.length > 0;

  if (!showList) {
    return (
      <ResponseShell title={title} icon={IndianRupee} className="border-emerald-100">
        <p className="text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(amount)}</p>
      </ResponseShell>
    );
  }

  return (
    <div className="space-y-3">
      <ResponseShell title={title} icon={IndianRupee} className="border-emerald-100">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(amount)}</p>
      </ResponseShell>
      <ResponseShell title="Breakdown" icon={Receipt}>
        <ShowMoreList
          items={items}
          allItems={allItems}
          hasMore={hasMore}
          totalCount={totalCount}
          renderItem={(row) => (
            <div className="flex items-center justify-between gap-3 py-1">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{row.name}</p>
                {row.date ? <p className="text-xs text-slate-500">{String(row.date).slice(0, 10)}</p> : null}
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-700">{formatCurrency(row.amount)}</p>
            </div>
          )}
        />
      </ResponseShell>
    </div>
  );
}
