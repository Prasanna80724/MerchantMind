/** Shared purchase order payload — PDF, cron job, and preview API. */

export const REORDER_QUANTITY = 10;
export const DEFAULT_DELIVERY_DAYS = 7;

export const PO_COLORS = {
  primary: [79, 70, 229],
  primaryDark: [67, 56, 202],
  accent: [16, 185, 129],
  gray: [248, 250, 252],
  text: [30, 41, 59],
  muted: [100, 116, 139],
  white: [255, 255, 255],
  status: {
    Pending: [245, 158, 11],
    Approved: [16, 185, 129],
    Declined: [239, 68, 68],
  },
};

export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generatePoNumber() {
  const year = new Date().getFullYear();
  const seq = Math.floor(1000 + Math.random() * 9000);
  return `PO-${year}-${seq}`;
}

export function defaultExpectedDeliveryDate(fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setDate(d.getDate() + DEFAULT_DELIVERY_DAYS);
  return d.toISOString().slice(0, 10);
}

/**
 * Buyer email: company/account only — never supplier row.email from SQL joins.
 */
function resolveBuyerEmail(record = {}) {
  if (record.company_email) return String(record.company_email);
  if (record.user_email) return String(record.user_email);
  const hasSupplierFields =
    record.supplier_email != null ||
    record.supplier_name != null ||
    record.supplier_id != null;
  if (!hasSupplierFields && record.email) return String(record.email);
  return "";
}

/**
 * Buyer = our company (users table / company profile settings ONLY).
 * Never use supplier fields or ambiguous row.email here.
 */
export function mapBuyerFromRecord(record = {}) {
  return {
    name: record.company_name || record.name || record.username || "Our Company",
    email: resolveBuyerEmail(record),
    phone: record.company_phone || record.phone || "",
    address: record.company_address || record.address || "",
    gst: record.company_gst || record.gst || "",
    website: record.company_website || record.website || "",
    logoUrl: record.company_logo_url || record.logoUrl || "",
  };
}

/**
 * Supplier = vendors table ONLY.
 * Never use logged-in user email/name here.
 */
export function mapSupplierFromRecord(record = {}) {
  return {
    supplierId: record.supplier_id ?? record.supplierId,
    name: record.supplier_name || record.name || "Supplier",
    email: record.supplier_email != null ? String(record.supplier_email) : record.email ? String(record.email) : "",
    phone: record.supplier_phone || record.phone_no || record.phone || "",
    address: record.supplier_address || record.address || "",
  };
}

export function buildPurchaseOrderPayload({
  buyer,
  product = {},
  supplier,
  poNumber,
  status = "Pending",
  reorderQty = REORDER_QUANTITY,
  poDate = new Date().toISOString(),
  expectedDeliveryDate,
  specialInstructions,
}) {
  const unitCost = Number(product.price) || 0;
  const qty = Number(reorderQty) || REORDER_QUANTITY;
  const estimatedTotal = Math.round(unitCost * qty * 100) / 100;
  const delivery = expectedDeliveryDate || defaultExpectedDeliveryDate(poDate);

  const buyerData = mapBuyerFromRecord(buyer || {});
  const supplierData = mapSupplierFromRecord(supplier || {});

  return {
    buyer: buyerData,
    purchaseOrder: {
      number: poNumber || generatePoNumber(),
      date: poDate,
      status,
      expectedDeliveryDate: delivery,
    },
    supplier: supplierData,
    lineItems: [
      {
        product: product.p_name || product.name || "Product",
        quantityRequested: qty,
        unitCost,
        estimatedTotal,
      },
    ],
    summary: {
      estimatedTotal,
    },
    meta: {
      generatedAt: new Date().toISOString(),
      specialInstructions:
        specialInstructions ||
        "Please fulfill this replenishment order by the expected delivery date. This is a purchase request, not a bill or payment demand.",
      productId: product.product_id,
      supplierId: supplierData.supplierId,
    },
  };
}

/** Rebuild preview payload from purchase_orders + joins (explicit column mapping). */
export function payloadFromPurchaseOrderRow(row) {
  return buildPurchaseOrderPayload({
    buyer: mapBuyerFromRecord({
      company_name: row.company_name,
      company_address: row.company_address,
      company_phone: row.company_phone,
      company_email: row.company_email,
      company_gst: row.company_gst,
      company_website: row.company_website,
      company_logo_url: row.company_logo_url,
      user_email: row.user_email,
      username: row.username,
    }),
    supplier: mapSupplierFromRecord({
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name,
      supplier_email: row.supplier_email,
      supplier_phone: row.supplier_phone,
    }),
    product: {
      product_id: row.product_id,
      p_name: row.p_name,
      category: row.category,
      price: row.price,
    },
    poNumber: row.po_number,
    status: row.status,
    reorderQty: row.reorder_quantity || REORDER_QUANTITY,
    poDate: row.created_at || new Date().toISOString(),
    expectedDeliveryDate: row.expected_delivery_date
      ? new Date(row.expected_delivery_date).toISOString().slice(0, 10)
      : undefined,
  });
}
