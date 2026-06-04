import { FileText } from "lucide-react";
import Badge from "../../Badge/Badge";
import ResponseShell from "./ResponseShell";
import ShowMoreList from "./ShowMoreList";

export default function PurchaseOrdersResponse({
  title = "Pending Purchase Orders",
  items = [],
  allItems,
  hasMore,
  totalCount,
}) {
  return (
    <ResponseShell
      title={title}
      subtitle={totalCount != null ? `${totalCount} pending` : undefined}
      icon={FileText}
    >
      {items.length === 0 ? (
        <p className="text-sm text-emerald-800">No pending purchase orders.</p>
      ) : (
        <ShowMoreList
          items={items}
          allItems={allItems}
          hasMore={hasMore}
          totalCount={totalCount}
          renderItem={(po) => (
            <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{po.poNumber || `PO #${po.poId}`}</p>
                  <p className="text-sm text-slate-600">{po.productName}</p>
                  <p className="text-xs text-slate-500">Supplier: {po.supplierName || "—"}</p>
                </div>
                <Badge variant="warning">{po.status}</Badge>
              </div>
              {po.reorderQuantity > 0 ? (
                <p className="mt-1 text-xs text-slate-500">Qty: {po.reorderQuantity}</p>
              ) : null}
            </div>
          )}
        />
      )}
    </ResponseShell>
  );
}
