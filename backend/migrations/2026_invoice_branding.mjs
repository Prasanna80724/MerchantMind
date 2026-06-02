// ============================================================================
//  Company profile + invoice metadata
//  Run: node backend/migrations/2026_invoice_branding.mjs
// ============================================================================
import mysql from "mysql2/promise";

const DB = "merchantmind";
const c = await mysql.createConnection({
  host: "localhost",
  user: "Prasanna",
  password: "2006",
  database: DB,
});

const log = (msg) => console.log(`  - ${msg}`);

const columnExists = async (t, col) => {
  const [r] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?",
    [DB, t, col]
  );
  return r[0].n > 0;
};

try {
  console.log("Adding company profile columns to users...");
  const userCols = [
    ["company_name", "VARCHAR(255) NOT NULL DEFAULT 'My Company' AFTER email"],
    ["company_address", "TEXT NULL AFTER company_name"],
    ["company_phone", "VARCHAR(50) NULL AFTER company_address"],
    ["company_gst", "VARCHAR(50) NULL AFTER company_phone"],
    ["company_website", "VARCHAR(255) NULL AFTER company_gst"],
    ["company_logo_url", "VARCHAR(500) NULL AFTER company_website"],
  ];
  for (const [col, def] of userCols) {
    if (!(await columnExists("users", col))) {
      await c.query(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
      log(`added users.${col}`);
    }
  }
  await c.query("UPDATE users SET company_name = username WHERE company_name = 'My Company' OR company_name = ''");
  log("backfilled company_name from username");

  console.log("Adding invoice metadata columns...");
  if (!(await columnExists("invoices", "invoice_number"))) {
    await c.query("ALTER TABLE invoices ADD COLUMN invoice_number VARCHAR(20) NULL AFTER supplier_id");
    log("added invoices.invoice_number");
  }
  if (!(await columnExists("invoices", "reorder_quantity"))) {
    await c.query("ALTER TABLE invoices ADD COLUMN reorder_quantity INT NOT NULL DEFAULT 10 AFTER invoice_number");
    log("added invoices.reorder_quantity");
  }

  console.log("\nInvoice branding migration completed.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await c.end();
}
