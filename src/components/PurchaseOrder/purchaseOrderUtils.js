/** Purchase order display helpers. */

export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

export const statusStyles = {
  Pending: "bg-amber-100 text-amber-800 ring-amber-200",
  Approved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  Declined: "bg-red-100 text-red-800 ring-red-200",
};

export function formatPoDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN");
}

export const samplePurchaseOrderPayload = {
  buyer: {
    name: "MerchantMind Pvt Ltd",
    email: "orders@merchantmind.com",
    phone: "+91 98765 43210",
    address: "42 Business Park, Tech Corridor, Chennai 600001",
    gst: "33AABCU9603R1ZM",
    website: "www.merchantmind.com",
    logoUrl: "",
  },
  purchaseOrder: {
    number: "PO-2026-4821",
    date: new Date().toISOString(),
    status: "Pending",
    expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  },
  supplier: {
    name: "Prasanna M",
    email: "prasanna1622006@gmail.com",
    phone: "8248644905",
    address: "",
  },
  lineItems: [
    {
      product: "A4 Paper",
      quantityRequested: 10,
      unitCost: 100,
      estimatedTotal: 1000,
    },
  ],
  summary: { estimatedTotal: 1000 },
  meta: {
    generatedAt: new Date().toISOString(),
    specialInstructions:
      "Please deliver to our warehouse receiving dock. This is a replenishment purchase order, not a bill.",
  },
};
