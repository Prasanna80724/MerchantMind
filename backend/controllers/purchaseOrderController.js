import db from "../config/db.js";
import { payloadFromPurchaseOrderRow } from "../services/purchaseOrderData.js";
import { generatePurchaseOrderPdf } from "../services/purchaseOrderPdfService.js";

const PO_DETAIL_QUERY = `
  SELECT
    po.*,
    p.p_name, p.category, p.price, p.product_id,
    s.name AS supplier_name, s.email AS supplier_email, s.phone_no AS supplier_phone,
    u.username, u.email AS user_email,
    u.company_name, u.company_address, u.company_phone, u.company_email,
    u.company_gst, u.company_website, u.company_logo_url
  FROM purchase_orders po
  JOIN products p ON po.product_id = p.product_id AND po.user_id = p.user_id
  JOIN suppliers s ON po.supplier_id = s.supplier_id AND po.user_id = s.user_id
  JOIN users u ON po.user_id = u.user_id
  WHERE po.po_id = ? AND po.user_id = ?
`;

async function loadPurchaseOrderRow(poId, user_id) {
  const [rows] = await db.query(PO_DETAIL_QUERY, [poId, user_id]);
  return rows[0] || null;
}

export const getPurchaseOrders = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT
         po.*,
         p.p_name,
         p.category,
         p.price,
         TO_BASE64(po.document_pdf) AS document_pdf
       FROM purchase_orders po
       JOIN products p ON po.product_id = p.product_id AND po.user_id = p.user_id
       WHERE po.user_id = ?
       ORDER BY po.created_at DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
};

export const getPurchaseOrderPreview = async (req, res) => {
  const user_id = req.user.user_id;
  const poId = Number.parseInt(req.params.poId, 10);

  if (!Number.isFinite(poId)) {
    return res.status(400).json({ error: "Invalid purchase order id" });
  }

  try {
    const row = await loadPurchaseOrderRow(poId, user_id);

    if (!row) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json(payloadFromPurchaseOrderRow(row));
  } catch (error) {
    console.error("Error fetching PO preview:", error);
    res.status(500).json({ error: "Failed to fetch purchase order preview" });
  }
};

export const getPurchaseOrderPdf = async (req, res) => {
  const user_id = req.user.user_id;
  const poId = Number.parseInt(req.params.poId, 10);

  if (!Number.isFinite(poId)) {
    return res.status(400).json({ error: "Invalid purchase order id" });
  }

  try {
    const row = await loadPurchaseOrderRow(poId, user_id);

    if (!row) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    const payload = payloadFromPurchaseOrderRow(row);
    const pdfData = generatePurchaseOrderPdf(payload);

    await db.query(
      "UPDATE purchase_orders SET document_pdf = ?, updated_at = NOW() WHERE po_id = ? AND user_id = ?",
      [pdfData, poId, user_id]
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${row.po_number || `PO-${poId}`}.pdf"`
    );
    res.send(pdfData);
  } catch (error) {
    console.error("Error generating PO PDF:", error);
    res.status(500).json({ error: "Failed to generate purchase order PDF" });
  }
};

export const approvePurchaseOrder = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const { poId } = req.params;
    const [result] = await db.query(
      "UPDATE purchase_orders SET status = ?, updated_at = NOW() WHERE po_id = ? AND user_id = ?",
      ["Approved", poId, user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json({ message: "Purchase order approved successfully" });
  } catch (error) {
    console.error("Error approving purchase order:", error);
    res.status(500).json({ error: "Failed to approve purchase order" });
  }
};

export const declinePurchaseOrder = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const { poId } = req.params;
    const [result] = await db.query(
      "DELETE FROM purchase_orders WHERE po_id = ? AND user_id = ?",
      [poId, user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json({ message: "Purchase order declined successfully" });
  } catch (error) {
    console.error("Error declining purchase order:", error);
    res.status(500).json({ error: "Failed to decline purchase order" });
  }
};
