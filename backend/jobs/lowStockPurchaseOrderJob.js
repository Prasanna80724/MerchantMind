import db from "../config/db.js";
import {
  buildPurchaseOrderPayload,
  generatePoNumber,
  mapBuyerFromRecord,
  mapSupplierFromRecord,
  REORDER_QUANTITY,
  defaultExpectedDeliveryDate,
} from "../services/purchaseOrderData.js";
import { generatePurchaseOrderPdf } from "../services/purchaseOrderPdfService.js";

const LOW_STOCK_QUERY = `
  SELECT p.user_id, p.product_id, p.p_name, p.category, p.price, p.threshold,
         i.quantity,
         s.supplier_id,
         s.name AS supplier_name,
         s.email AS supplier_email,
         s.phone_no AS supplier_phone,
         u.username,
         u.email AS user_email,
         u.company_name,
         u.company_address,
         u.company_phone,
         u.company_email,
         u.company_gst,
         u.company_website,
         u.company_logo_url
  FROM products p
  JOIN inventory i ON p.product_id = i.product_id AND p.user_id = i.user_id
  JOIN (
    SELECT ps1.product_id, ps1.user_id, ps1.supplier_id
    FROM product_supplied ps1
    INNER JOIN (
      SELECT product_id, user_id, MAX(supplied_date) AS latest
      FROM product_supplied
      GROUP BY product_id, user_id
    ) latest_ps
      ON ps1.product_id = latest_ps.product_id
     AND ps1.user_id = latest_ps.user_id
     AND ps1.supplied_date = latest_ps.latest
  ) latest_supply
    ON latest_supply.product_id = p.product_id AND latest_supply.user_id = p.user_id
  JOIN suppliers s
    ON s.supplier_id = latest_supply.supplier_id AND s.user_id = p.user_id
  JOIN users u ON u.user_id = p.user_id
  WHERE i.quantity < p.threshold
`;

export async function runLowStockPurchaseOrderJob() {
  console.log("Low-stock purchase order job running...");
  try {
    const [rows] = await db.query(LOW_STOCK_QUERY);

    if (rows.length === 0) {
      console.log("No products below threshold — skipping PO generation.");
      return;
    }

    for (const row of rows) {
      const [existing] = await db.query(
        `SELECT po_id FROM purchase_orders
         WHERE product_id = ? AND user_id = ? AND status IN ('Pending', 'Approved')`,
        [row.product_id, row.user_id]
      );

      if (existing.length > 0) {
        console.log(`PO already exists for product ${row.product_id} — skipping.`);
        continue;
      }

      const poNumber = generatePoNumber();
      const expectedDelivery = defaultExpectedDeliveryDate();
      const payload = buildPurchaseOrderPayload({
        buyer: mapBuyerFromRecord(row),
        product: row,
        supplier: mapSupplierFromRecord(row),
        poNumber,
        status: "Pending",
        reorderQty: REORDER_QUANTITY,
        expectedDeliveryDate: expectedDelivery,
      });

      const pdfData = generatePurchaseOrderPdf(payload);

      const [result] = await db.query(
        `INSERT INTO purchase_orders
           (user_id, product_id, supplier_id, po_number, reorder_quantity,
            expected_delivery_date, document_pdf, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())`,
        [
          row.user_id,
          row.product_id,
          row.supplier_id,
          poNumber,
          REORDER_QUANTITY,
          expectedDelivery,
          pdfData,
        ]
      );

      if (result.affectedRows > 0) {
        console.log(`PO ${poNumber} stored for product ${row.product_id}`);
      }
    }

    console.log("Low-stock purchase order job completed.");
  } catch (error) {
    console.error("Low-stock purchase order job failed:", error.message);
  }
}

export default runLowStockPurchaseOrderJob;
