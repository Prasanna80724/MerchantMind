import { Mail, Phone, Users } from "lucide-react";
import Card, { CardHeader, CardTitle } from "../../Card/Card";
import Badge from "../../Badge/Badge";

export default function SupplierCard({ items = [] }) {
  if (items.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No suppliers found. Add suppliers from the Suppliers page.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/10 to-violet-500/10 text-brand-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Your suppliers</CardTitle>
            <p className="text-xs text-slate-500">{items.length} on file</p>
          </div>
        </div>
      </CardHeader>
      <ul className="space-y-3">
        {items.map((s, idx) => (
          <li
            key={s.supplierId ?? idx}
            className="rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-slate-900">{s.name}</p>
              <Badge variant={s.status === "Active" ? "success" : "default"}>{s.status}</Badge>
            </div>
            <div className="mt-2 space-y-1 text-xs text-slate-600">
              {s.email && (
                <p className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                  {s.email}
                </p>
              )}
              {s.phone && (
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                  {s.phone}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
