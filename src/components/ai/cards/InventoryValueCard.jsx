import { Box, IndianRupee, Package } from "lucide-react";
import Card from "../../Card/Card";
import StatCard from "../../StatCard/StatCard";
import { formatCurrency } from "../../../utils/currency";

export default function InventoryValueCard({ metrics }) {
  const totalValue = metrics?.totalValue ?? 0;
  const productCount = metrics?.productCount ?? 0;
  const totalUnits = metrics?.totalUnits ?? 0;

  return (
    <div className="space-y-4">
      <Card className="border-brand-100 bg-gradient-to-br from-brand-50/50 to-violet-50/30">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total inventory value</p>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{formatCurrency(totalValue)}</p>
          </div>
        </div>
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Products tracked"
          value={String(productCount)}
          icon={Package}
          accent="brand"
        />
        <StatCard
          title="Units in stock"
          value={String(totalUnits)}
          icon={Box}
          accent="slate"
        />
      </div>
    </div>
  );
}
