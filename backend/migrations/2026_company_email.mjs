// Run: node backend/migrations/2026_company_email.mjs
import mysql from "mysql2/promise";

const DB = "merchantmind";
const c = await mysql.createConnection({
  host: "localhost",
  user: "Prasanna",
  password: "2006",
  database: DB,
});

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
