import { Box, FileText, ShoppingCart, Sparkles, Users } from "lucide-react";
import SuggestedQuestions from "./SuggestedQuestions";

const CAPABILITIES = [
  { icon: Box, label: "Inventory & stock levels" },
  { icon: Users, label: "Suppliers" },
  { icon: ShoppingCart, label: "Sales & revenue" },
  { icon: FileText, label: "Purchase orders" },
];

export default function WelcomeScreen({ onSelectQuestion, suggestions, disabled }) {
  return (
    <div className="space-y-4 p-4">
      <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-white to-brand-50/40 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/15 text-brand-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">MerchantMind Assistant</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Ask questions about your inventory, suppliers, sales, invoices, and purchase orders.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {CAPABILITIES.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white/80 px-2.5 py-2 text-xs text-slate-600"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" />
              {label}
            </div>
          ))}
        </div>
      </div>
      <SuggestedQuestions
        questions={suggestions}
        onSelect={onSelectQuestion}
        disabled={disabled}
        compact
      />
    </div>
  );
}
