import {
  Calendar,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { cn } from "../../utils/cn";
import {
  formatCurrency,
  formatDateTime,
  formatPoDate,
  statusStyles,
} from "./purchaseOrderUtils";

function StatusPill({ status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset",
        statusStyles[status] || statusStyles.Pending
      )}
    >
      {status}
    </span>
  );
}

function PartyCard({ title, party, accent = "indigo" }) {
  const border = accent === "emerald" ? "border-emerald-100 bg-emerald-50/50" : "border-indigo-100 bg-indigo-50/50";
  return (
    <div className={cn("rounded-xl border p-4", border)}>
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="font-semibold text-slate-900">{party.name || "—"}</p>
      <div className="mt-2 space-y-1.5 text-sm text-slate-600">
        {party.email && (
          <p className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {party.email}
          </p>
        )}
        {party.phone && (
          <p className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {party.phone}
          </p>
        )}
        {party.address && (
          <p className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
            {party.address}
          </p>
        )}
        {!party.email && !party.phone && !party.address && (
          <p className="text-xs text-slate-400">No contact details on file</p>
        )}
      </div>
    </div>
  );
}

/** Purchase order preview — buyer and supplier clearly separated. */
export default function PurchaseOrderPreview({ data, className, compact = false }) {
  if (!data) return null;

  const buyer = data.buyer || data.company;
  const { purchaseOrder: po, supplier, lineItems, summary, meta } = data;
  const instructions = meta?.specialInstructions || meta?.notes;

  return (
    <div
      className={cn(
        "mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60",
        compact ? "max-w-2xl text-sm" : "max-w-3xl",
        className
      )}
    >
      {/* PO title band — no buyer/supplier mixed here */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 px-6 py-5 text-white sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              <h2 className="text-lg font-bold tracking-wide">PURCHASE ORDER</h2>
            </div>
            <p className="mt-1 text-xs text-indigo-200">
              Replenishment request to supplier — not a bill or payment demand
            </p>
          </div>
          <div className="rounded-xl bg-white/95 p-3 text-slate-800 shadow sm:min-w-[180px]">
            <p className="font-mono text-sm font-semibold">PO #{po.number}</p>
            <p className="mt-1 text-xs text-slate-500">PO Date: {formatPoDate(po.date)}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
              <Calendar className="h-3 w-3" />
              Expected delivery: {formatPoDate(po.expectedDeliveryDate)}
            </p>
            <div className="mt-2">
              <StatusPill status={po.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Buyer | Supplier side by side */}
      <div className="grid gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-2 sm:px-8">
        <PartyCard title="Buyer (Our Company)" party={buyer} accent="indigo" />
        <PartyCard title="Supplier Information" party={supplier} accent="emerald" />
      </div>

      {/* Products requested */}
      <div className="px-6 py-5 sm:px-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
          Products Requested
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse text-sm">
            <thead>
              <tr className="bg-indigo-600 text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th className="rounded-tl-lg px-4 py-3">Product</th>
                <th className="px-4 py-3 text-center">Qty Requested</th>
                <th className="px-4 py-3 text-right">Unit Cost</th>
                <th className="rounded-tr-lg px-4 py-3 text-right">Est. Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, idx) => (
                <tr
                  key={`${item.product}-${idx}`}
                  className={cn(
                    "border-b border-slate-100",
                    idx % 2 === 1 && "bg-slate-50/80"
                  )}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{item.product}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{item.quantityRequested}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.unitCost)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrency(item.estimatedTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary + notes + signature */}
      <div className="grid gap-6 border-t border-slate-100 bg-slate-50/50 px-6 py-5 sm:grid-cols-2 sm:px-8">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Notes</p>
          <p className="text-sm text-slate-600">{instructions}</p>
          <p className="mt-4 text-xs text-slate-400">
            Generated: {formatDateTime(meta?.generatedAt)}
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order Summary</p>
            <div className="mt-2 flex items-center justify-between border-t-2 border-indigo-200 pt-3">
              <span className="font-semibold text-indigo-700">Estimated Total</span>
              <span className="text-xl font-bold tabular-nums text-indigo-700">
                {formatCurrency(summary.estimatedTotal)}
              </span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Authorized By</p>
            <p className="mt-1 text-xs text-slate-400">Manager Signature</p>
            <div className="mt-3 border-b border-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
