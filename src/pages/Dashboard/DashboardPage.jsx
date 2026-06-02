import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Box,
  IndianRupee,
  ShoppingCart,
  Users,
} from "lucide-react";
import AppLayout from "../../components/Layout/AppLayout";
import StatCard from "../../components/StatCard/StatCard";
import Card, { CardHeader, CardTitle } from "../../components/Card/Card";
import Badge from "../../components/Badge/Badge";
import { PageSkeleton } from "../../components/Loader/Loader";
import PageHeader from "../../components/PageHeader/PageHeader";
import { getInventory, getProductSales, getSuppliersList } from "../../services/productService";
import { getMonthlyStats, getSalesReport } from "../../services/reportService";
import { getSales } from "../../services/salesService";
import { toast } from "sonner";

const chartTooltipStyle = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgb(15 23 42 / 0.07)",
  },
};

export default function DashboardPage() {
  const [salesData, setSalesData] = useState([]);
  const [productSalesData, setProductSalesData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ totalSales: 0, totalPurchase: 0, profitOrLoss: 0, currentMonth: "" });
  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSalesReport(),
      getProductSales(),
      getMonthlyStats(),
      getInventory(),
      getSuppliersList(),
      getSales(),
    ])
      .then(([report, products, stats, inv, supp, sales]) => {
        setSalesData(Array.isArray(report) ? report : []);
        setProductSalesData(
          (products || []).map((item) => ({
            ...item,
            total_sold: Number(item.total_sold),
            remaining_stock: Number(item.remaining_stock),
          }))
        );
        setMonthlyStats(stats || {});
        setInventory(inv || []);
        setSuppliers(supp || []);
        setRecentSales((sales || []).slice(0, 5));
      })
      .catch(() => toast.error("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  const lowStockItems = inventory.filter(
    (p) => Number(p.quantity) <= Number(p.threshold || 0) && Number(p.threshold) > 0
  );

  if (loading) {
    return (
      <AppLayout>
        <PageSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description={`Overview for ${monthlyStats.currentMonth || "this month"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Products" value={inventory.length} icon={Box} accent="brand" delay={0} />
        <StatCard title="Total Suppliers" value={suppliers.length} icon={Users} accent="slate" delay={0.05} />
        <StatCard title="Total Sales" value={recentSales.length > 0 ? `${salesData.length} days` : "0"} subtitle={`${productSalesData.reduce((s, p) => s + p.total_sold, 0)} units sold`} icon={ShoppingCart} accent="success" delay={0.1} />
        <StatCard title="Revenue" value={`₹${Number(monthlyStats.totalSales || 0).toLocaleString()}`} subtitle={`P/L: ₹${Number(monthlyStats.profitOrLoss || 0).toLocaleString()}`} icon={IndianRupee} accent={monthlyStats.profitOrLoss >= 0 ? "success" : "danger"} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue trends</CardTitle>
              <Badge variant="brand">Live</Badge>
            </CardHeader>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="sales_date" tickFormatter={(v) => format(new Date(v), "MM/dd")} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip {...chartTooltipStyle} formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Sales"]} labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")} />
                  <Area type="monotone" dataKey="total_sales" stroke="#6366f1" strokeWidth={2} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Monthly summary</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total sales</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">₹{Number(monthlyStats.totalSales || 0).toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Purchase cost</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">₹{Number(monthlyStats.totalPurchase || 0).toLocaleString()}</p>
              </div>
              <div className={`rounded-xl p-4 ${monthlyStats.profitOrLoss >= 0 ? "bg-success-light" : "bg-danger-light"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
                    {monthlyStats.profitOrLoss >= 0 ? "Profit" : "Loss"}
                  </p>
                  {monthlyStats.profitOrLoss >= 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-danger" />
                  )}
                </div>
                <p className={`mt-1 text-2xl font-bold ${monthlyStats.profitOrLoss >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  ₹{Math.abs(Number(monthlyStats.profitOrLoss || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stock overview</CardTitle>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productSalesData.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis type="category" dataKey="product_name" width={100} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip {...chartTooltipStyle} />
                <Bar dataKey="total_sold" fill="#6366f1" radius={[0, 4, 4, 0]} name="Sold" />
                <Bar dataKey="remaining_stock" fill="#10b981" radius={[0, 4, 4, 0]} name="Stock" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {lowStockItems.length > 0 && <AlertTriangle className="h-4 w-4 text-warning" />}
              Inventory alerts
            </CardTitle>
          </CardHeader>
          {lowStockItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">All products are above threshold levels.</p>
          ) : (
            <ul className="space-y-3">
              {lowStockItems.slice(0, 6).map((item) => (
                <li key={item.product_id} className="flex items-center justify-between rounded-lg border border-warning/20 bg-warning-light/50 px-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900">{item.p_name}</p>
                    <p className="text-xs text-slate-500">Threshold: {item.threshold}</p>
                  </div>
                  <Badge variant="warning">{item.quantity} left</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        {recentSales.length === 0 ? (
          <p className="pb-4 text-center text-sm text-slate-500">No recent sales recorded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <div key={sale.sales_id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-slate-900">{sale.p_name || `Product #${sale.product_id}`}</p>
                  <p className="text-xs text-slate-500">{sale.customer_name} · {sale.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">₹{Number(sale.total_price).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">{sale.sales_date ? format(new Date(sale.sales_date), "MMM d") : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
