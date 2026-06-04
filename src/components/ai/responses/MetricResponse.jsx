import { IndianRupee, Package } from "lucide-react";
import { formatCurrency } from "../../../utils/currency";
import ResponseShell from "./ResponseShell";
import StatCard from "../../StatCard/StatCard";

export default function MetricResponse({ title, amount, secondary = [] }) {
  return (
    <div className="space-y-3">
      <ResponseShell title={title} icon={IndianRupee} className="border-brand-100 bg-gradient-to-br from-brand-50/40 to-violet-50/20">
        <p className="text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(amount)}</p>
      </ResponseShell>
      {secondary.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {secondary.map((row) => (
            <StatCard
              key={row.label}
              title={row.label}
              value={row.value}
              icon={Package}
              accent="slate"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
