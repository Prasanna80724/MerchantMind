import { FileText } from "lucide-react";
import Card, { CardHeader, CardTitle } from "../../Card/Card";
import Badge from "../../Badge/Badge";

export default function PurchaseOrdersCard({ items = [] }) {
  if (items.length === 0) {
    return (
      <Card className="border-emerald-100 bg-emerald-50/40">
        <p className="text-sm text-emerald-800">No pending purchase orders at the moment.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Pending purchase orders</CardTitle>
            <p className="text-xs text-slate-500">{items.length} awaiting action</p>
          </div>
        </div>
      </CardHeader>
      <ul className="divide-y divide-slate-100">
        {items.map((po, idx) => (
          <li key={po.poId ?? idx} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{po.poNumber || `PO #${po.poId}`}</p>
                <p className="text-sm text-slate-600">{po.productName}</p>
                <p className="text-xs text-slate-500">Supplier: {po.supplierName || "—"}</p>
              </div>
              <Badge variant="warning">{po.status}</Badge>
            </div>
            {po.reorderQuantity > 0 && (
              <p className="mt-1 text-xs text-slate-500">Qty requested: {po.reorderQuantity}</p>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
