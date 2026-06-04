import { AlertTriangle } from "lucide-react";
import Card, { CardHeader, CardTitle } from "../../Card/Card";
import Badge from "../../Badge/Badge";

export default function LowStockCard({ items = [] }) {
  if (items.length === 0) {
    return (
      <Card className="border-emerald-100 bg-emerald-50/40">
        <p className="text-sm text-emerald-800">All products are at or above their reorder levels.</p>
      </Card>
    );
  }

  return (
    <Card className="border-amber-100">
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Items needing attention</CardTitle>
            <p className="text-xs text-slate-500">{items.length} product{items.length !== 1 ? "s" : ""} below threshold</p>
          </div>
        </div>
      </CardHeader>
      <ul className="divide-y divide-slate-100">
        {items.map((item, idx) => (
          <li key={item.productId ?? idx} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{item.name}</p>
              {item.category && <p className="text-xs text-slate-500">{item.category}</p>}
            </div>
            <div className="shrink-0 text-right">
              <Badge variant="warning">{item.quantity} in stock</Badge>
              <p className="mt-1 text-xs text-slate-500">Reorder at {item.threshold}</p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
