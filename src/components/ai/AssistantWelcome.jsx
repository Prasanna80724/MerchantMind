import { Box, FileText, MessageCircle, ShoppingCart, Sparkles, Users } from "lucide-react";
import Card, { CardDescription, CardTitle } from "../Card/Card";

const CAPABILITIES = [
  {
    icon: Box,
    title: "Inventory",
    description: "Stock levels, low items, and total inventory value",
  },
  {
    icon: Users,
    title: "Suppliers",
    description: "Who supplies your products and supplier contact details",
  },
  {
    icon: ShoppingCart,
    title: "Sales",
    description: "Recent sales, revenue, and best-selling products",
  },
  {
    icon: FileText,
    title: "Purchase orders",
    description: "Pending orders and replenishment status",
  },
];

export default function AssistantWelcome() {
  return (
    <Card className="border-brand-100 bg-gradient-to-br from-white to-brand-50/30">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600 shadow-sm">
          <MessageCircle className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Welcome to MerchantMind Assistant</CardTitle>
            <Sparkles className="h-4 w-4 text-brand-500" />
          </div>
          <CardDescription className="mt-1 max-w-2xl">
            Get quick answers about your shop — stock, suppliers, sales, and purchase orders — in
            plain language. Pick a suggestion below or type your own question.
          </CardDescription>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CAPABILITIES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-slate-100 bg-white/80 p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/10 to-violet-500/10 text-brand-600">
              <Icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
