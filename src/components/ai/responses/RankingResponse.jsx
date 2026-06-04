import { TrendingUp } from "lucide-react";
import ResponseShell from "./ResponseShell";
import ShowMoreList from "./ShowMoreList";

export default function RankingResponse({
  title,
  items = [],
  allItems,
  hasMore,
  totalCount,
  valueLabel = "units",
}) {
  return (
    <ResponseShell title={title} icon={TrendingUp}>
      <ShowMoreList
        items={items}
        allItems={allItems}
        hasMore={hasMore}
        totalCount={totalCount}
        renderItem={(item) => (
          <div className="flex items-baseline justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
            <span className="text-sm text-slate-500 tabular-nums">{item.rank}.</span>
            <span className="min-w-0 flex-1 font-medium text-slate-900">{item.name}</span>
            <span className="shrink-0 text-sm font-semibold text-slate-700 tabular-nums">
              — {item.value}
              {valueLabel && valueLabel !== "units" ? ` ${valueLabel}` : ""}
            </span>
          </div>
        )}
      />
    </ResponseShell>
  );
}
