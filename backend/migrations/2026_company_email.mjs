// Run: node backend/migrations/2026_company_email.mjs
import { createMigrationConnection, getDatabaseName } from "../config/migrationDb.mjs";

const DB = getDatabaseName();
const c = await createMigrationConnection();

const columnExists = async (col) => {
  const [r] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='users' AND COLUMN_NAME=?",
    [DB, col]
  );
  return r[0].n > 0;
};

try {
  if (!(await columnExists("company_email"))) {
    await c.query(
      "ALTER TABLE users ADD COLUMN company_email VARCHAR(255) NULL AFTER company_phone"
    );
    console.log("  - added users.company_email");
  }
  console.log("\nCompany email migration completed.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await c.end();
}
