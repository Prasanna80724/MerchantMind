// Run: node backend/migrations/2026_invoice_to_purchase_order.mjs
import { createMigrationConnection, getDatabaseName } from "../config/migrationDb.mjs";

const DB = getDatabaseName();
const c = await createMigrationConnection();

const log = (msg) => console.log(`  - ${msg}`);

const tableExists = async (t) => {
  const [r] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?",
    [DB, t]
  );
  return r[0].n > 0;
};

const columnExists = async (t, col) => {
  const [r] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?",
    [DB, t, col]
  );
  return r[0].n > 0;
};

try {
  await c.query("SET FOREIGN_KEY_CHECKS = 0");

  if ((await tableExists("invoices")) && !(await tableExists("purchase_orders"))) {
    await c.query("RENAME TABLE invoices TO purchase_orders");
    log("renamed invoices → purchase_orders");
  }

  const table = (await tableExists("purchase_orders")) ? "purchase_orders" : null;
  if (!table) {
    log("purchase_orders table not found — run schema or prior migrations first");
  } else {
    if (await columnExists(table, "invoice_id")) {
      await c.query(`ALTER TABLE purchase_orders CHANGE invoice_id po_id INT NOT NULL AUTO_INCREMENT`);
      log("renamed invoice_id → po_id");
    }
    if (await columnExists(table, "invoice_number")) {
      await c.query(`ALTER TABLE purchase_orders CHANGE invoice_number po_number VARCHAR(20) NULL`);
      log("renamed invoice_number → po_number");
      await c.query(
        `UPDATE purchase_orders SET po_number = REPLACE(po_number, 'INV-', 'PO-') WHERE po_number LIKE 'INV-%'`
      );
    }
    if (await columnExists(table, "invoice_file_path")) {
      await c.query(`ALTER TABLE purchase_orders CHANGE invoice_file_path document_pdf LONGBLOB`);
      log("renamed invoice_file_path → document_pdf");
    }
    if (!(await columnExists(table, "expected_delivery_date"))) {
      await c.query(
        `ALTER TABLE purchase_orders ADD COLUMN expected_delivery_date DATE NULL AFTER reorder_quantity`
      );
      log("added expected_delivery_date");
    }
  }

  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\nInvoice → Purchase Order migration completed.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await c.end();
}
