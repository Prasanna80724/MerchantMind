import { ClipboardList } from "lucide-react";
import ResponseShell from "./ResponseShell";
import ShowMoreList from "./ShowMoreList";

const PRIMARY_KEYS = ["p_name", "product_name", "name", "supplier_name", "po_number", "title"];

function primaryLabel(row) {
  for (const k of PRIMARY_KEYS) {
    if (row[k] != null) return String(row[k]);
  }
  const first = Object.entries(row).find(([, v]) => v != null && typeof v !== "object");
  return first ? String(first[1]) : "Record";
}

function secondaryLine(row) {
  const parts = [];
  for (const [k, v] of Object.entries(row)) {
    if (v == null || PRIMARY_KEYS.includes(k)) continue;
    if (String(v).includes("[binary")) continue;
    parts.push(`${k.replace(/_/g, " ")}: ${v}`);
    if (parts.length >= 2) break;
  }
  return parts.join(" · ");
}

export default function GenericListResponse({
  title = "Results",
  items = [],
  allItems,
  hasMore,
  totalCount,
}) {
  if (!items.length) return null;

  return (
    <ResponseShell title={title} icon={ClipboardList}>
      <ShowMoreList
        items={items}
        allItems={allItems}
        hasMore={hasMore}
        totalCount={totalCount}
        renderItem={(row) => (
          <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
            <p className="font-medium text-slate-900">{primaryLabel(row)}</p>
            {secondaryLine(row) ? <p className="text-xs text-slate-500">{secondaryLine(row)}</p> : null}
          </div>
        )}
      />
    </ResponseShell>
  );
}
