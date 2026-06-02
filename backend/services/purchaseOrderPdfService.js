import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable/es";
import { PO_COLORS, formatCurrency } from "./purchaseOrderData.js";

const MARGIN = 14;
const PAGE_W = 210;
const HALF_W = (PAGE_W - MARGIN * 2 - 6) / 2;

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function drawPoTitleBlock(doc, payload) {
  const { purchaseOrder: po } = payload;
  const c = PO_COLORS;

  doc.setFillColor(...c.primary);
  doc.rect(0, 0, PAGE_W, 32, "F");

  doc.setTextColor(...c.white);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("PURCHASE ORDER", MARGIN, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Replenishment request to supplier — not a bill or payment demand", MARGIN, 22);

  const cardX = PAGE_W - MARGIN - 68;
  doc.setFillColor(...c.white);
  doc.roundedRect(cardX, 6, 68, 24, 2, 2, "F");
  doc.setTextColor(...c.text);
  doc.setFontSize(9);
  doc.text(`PO #: ${po.number}`, cardX + 4, 13);
  doc.text(`PO Date: ${fmtDate(po.date)}`, cardX + 4, 18);
  doc.text(`Delivery: ${fmtDate(po.expectedDeliveryDate)}`, cardX + 4, 23);

  const statusColor = c.status[po.status] || c.status.Pending;
  doc.setFillColor(...statusColor);
  doc.roundedRect(cardX + 4, 25, 24, 5, 1, 1, "F");
  doc.setTextColor(...c.white);
  doc.setFontSize(6);
  doc.setFont("helvetica", "bold");
  doc.text(String(po.status).toUpperCase(), cardX + 7, 28.5);
}

function drawPartyCard(doc, label, party, x, y, width) {
  const c = PO_COLORS;

  doc.setTextColor(...c.text);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(label, x, y);

  doc.setFillColor(...c.gray);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(x, y + 3, width, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...c.text);
  doc.text(party.name || "—", x + 4, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...c.muted);
  let lineY = y + 17;
  const lines = [
    party.email ? `Email: ${party.email}` : null,
    party.phone ? `Phone: ${party.phone}` : null,
    party.address ? party.address : null,
  ].filter(Boolean);

  for (const line of lines) {
    const wrapped = doc.splitTextToSize(line, width - 8);
    doc.text(wrapped, x + 4, lineY);
    lineY += wrapped.length * 4.2;
    if (lineY > y + 36) break;
  }

  return y + 44;
}

function drawBuyerAndSupplier(doc, payload, startY) {
  const { buyer, supplier } = payload;
  const leftY = drawPartyCard(doc, "BUYER (OUR COMPANY)", buyer, MARGIN, startY, HALF_W);
  const rightY = drawPartyCard(
    doc,
    "SUPPLIER INFORMATION",
    supplier,
    MARGIN + HALF_W + 6,
    startY,
    HALF_W
  );
  return Math.max(leftY, rightY);
}

function drawProductsTable(doc, payload, startY) {
  const c = PO_COLORS;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...c.text);
  doc.text("PRODUCTS REQUESTED", MARGIN, startY);

  autoTable(doc, {
    startY: startY + 4,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Product", "Qty Requested", "Unit Cost", "Est. Total"]],
    body: payload.lineItems.map((item) => [
      item.product,
      String(item.quantityRequested),
      formatCurrency(item.unitCost),
      formatCurrency(item.estimatedTotal),
    ]),
    headStyles: {
      fillColor: c.primary,
      textColor: c.white,
      fontStyle: "bold",
      fontSize: 9,
      cellPadding: 3.5,
    },
    bodyStyles: { fontSize: 9, textColor: c.text, cellPadding: 3 },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { halign: "center", cellWidth: 28 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 32 },
    },
    theme: "grid",
    styles: { lineColor: [226, 232, 240], lineWidth: 0.2 },
  });

  return doc.lastAutoTable.finalY;
}

function drawOrderSummary(doc, payload, startY) {
  const c = PO_COLORS;
  const boxW = 78;
  const boxX = PAGE_W - MARGIN - boxW;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...c.text);
  doc.text("ORDER SUMMARY", boxX, startY);

  doc.setFillColor(...c.gray);
  doc.roundedRect(boxX, startY + 4, boxW, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...c.primary);
  doc.text("Estimated Total", boxX + 4, startY + 14);
  doc.setFontSize(12);
  doc.text(formatCurrency(payload.summary.estimatedTotal), boxX + boxW - 4, startY + 20, {
    align: "right",
  });
}

function drawNotesAndSignature(doc, payload, startY) {
  const c = PO_COLORS;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...c.text);
  doc.text("NOTES — SPECIAL INSTRUCTIONS", MARGIN, startY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...c.muted);
  const notes = payload.meta.specialInstructions || payload.meta.notes || "";
  doc.text(doc.splitTextToSize(notes, 110), MARGIN, startY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...c.text);
  doc.text("AUTHORIZED BY", PAGE_W - MARGIN - 55, startY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...c.muted);
  doc.text("Manager Signature", PAGE_W - MARGIN - 55, startY + 5);
  doc.line(PAGE_W - MARGIN - 55, startY + 14, PAGE_W - MARGIN, startY + 14);

  doc.setFontSize(7);
  doc.text(
    `Generated: ${new Date(payload.meta.generatedAt).toLocaleString("en-IN")}`,
    MARGIN,
    startY + 22
  );
}

export function generatePurchaseOrderPdf(payload) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });

  drawPoTitleBlock(doc, payload);
  let y = drawBuyerAndSupplier(doc, payload, 38);
  y = drawProductsTable(doc, payload, y + 6);
  drawOrderSummary(doc, payload, y + 8);
  drawNotesAndSignature(doc, payload, y + 36);

  return Buffer.from(doc.output("arraybuffer"));
}

export default generatePurchaseOrderPdf;
