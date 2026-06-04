import { Mail, Phone, Users } from "lucide-react";
import Badge from "../../Badge/Badge";
import ResponseShell from "./ResponseShell";
import ShowMoreList from "./ShowMoreList";

export default function SupplierResponse({
  title = "Suppliers",
  items = [],
  allItems,
  hasMore,
  totalCount,
}) {
  return (
    <ResponseShell
      title={title}
      subtitle={totalCount != null ? `${totalCount} on file` : undefined}
      icon={Users}
    >
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">No suppliers found.</p>
      ) : (
        <ShowMoreList
          items={items}
          allItems={allItems}
          hasMore={hasMore}
          totalCount={totalCount}
          renderItem={(s) => (
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900">{s.name}</p>
                <Badge variant={s.status === "Active" ? "success" : "default"}>{s.status}</Badge>
              </div>
              <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                {s.email ? (
                  <p className="flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-slate-400" />
                    {s.email}
                  </p>
                ) : null}
                {s.phone ? (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {s.phone}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        />
      )}
    </ResponseShell>
  );
}
