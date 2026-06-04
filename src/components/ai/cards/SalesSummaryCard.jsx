import { ShoppingCart, TrendingUp } from "lucide-react";
import Card, { CardHeader, CardTitle } from "../../Card/Card";
import { formatCurrency } from "../../../utils/currency";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SalesSummaryCard({ items = [] }) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No sales records found for this question.</p>
      </Card>
    );
  }

  const totalRevenue = items.reduce((sum, i) => sum + (Number(i.totalPrice) || 0), 0);
  const isRanking = items.some((i) => i.saleCount > 0 || i.quantity > 0) && !items[0]?.salesDate;

  return (
    <Card>
      <CardHeader className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 text-emerald-600">
              {isRanking ? <TrendingUp className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </div>
            <div>
              <CardTitle>{isRanking ? "Top performers" : "Recent sales"}</CardTitle>
              <p className="text-xs text-slate-500">{items.length} entr{items.length === 1 ? "y" : "ies"}</p>
            </div>
          </div>
          {totalRevenue > 0 && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Shown total</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <ul className="divide-y divide-slate-100">
        {items.map((item, idx) => (
          <li key={item.salesId ?? idx} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{item.productName || "Sale"}</p>
              {item.customerName && (
                <p className="text-xs text-slate-500">Customer: {item.customerName}</p>
              )}
              {item.salesDate && (
                <p className="text-xs text-slate-500">{formatDate(item.salesDate)}</p>
              )}
            </div>
            <div className="shrink-0 text-right text-sm">
              {item.quantity > 0 && (
                <p className="font-medium text-slate-700">{item.quantity} units</p>
              )}
              {item.totalPrice > 0 && (
                <p className="text-slate-600">{formatCurrency(item.totalPrice)}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
