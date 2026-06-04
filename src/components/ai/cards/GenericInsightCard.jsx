import { ClipboardList } from "lucide-react";
import Card, { CardHeader, CardTitle } from "../../Card/Card";
import Badge from "../../Badge/Badge";

const LABELS = {
  po_number: "PO Number",
  supplier_name: "Supplier",
  product_name: "Product",
  p_name: "Product",
  status: "Status",
  reorder_quantity: "Quantity",
  name: "Name",
  email: "Email",
  quantity: "Quantity",
  price: "Price",
  category: "Category",
};

function labelFor(key) {
  return LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function GenericInsightCard({ items = [], columns = [] }) {
  if (items.length === 0) {
    return null;
  }

  const cols = columns.length ? columns : Object.keys(items[0] || {});

  return (
    <Card>
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/10 to-slate-600/10 text-slate-600">
            <ClipboardList className="h-4 w-4" />
          </div>
          <CardTitle>Results</CardTitle>
        </div>
      </CardHeader>
      <div className="space-y-3">
        {items.slice(0, 10).map((row, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
          >
            <dl className="grid gap-2 sm:grid-cols-2">
              {cols.slice(0, 6).map((col) => {
                const val = row[col];
                if (val == null || String(val).includes("[binary")) return null;
                return (
                  <div key={col}>
                    <dt className="text-xs text-slate-500">{labelFor(col)}</dt>
                    <dd className="text-sm font-medium text-slate-900">
                      {col === "status" ? <Badge variant="warning">{String(val)}</Badge> : String(val)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </Card>
  );
}
