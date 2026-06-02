// ============================================================================
//  Supply audit + supplier soft-delete migration
//
//  Run: node backend/migrations/2026_supply_audit_soft_delete.mjs
// ============================================================================
import { createMigrationConnection, getDatabaseName } from "../config/migrationDb.mjs";

const DB = getDatabaseName();
const c = await createMigrationConnection({ multipleStatements: true });

const log = (msg) => console.log(`  - ${msg}`);

const columnExists = async (t, col) => {
  const [r] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND COLUMN_NAME=?",
    [DB, t, col]
  );
  return r[0].n > 0;
};

const tableExists = async (t) => {
  const [r] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?",
    [DB, t]
  );
  return r[0].n > 0;
};

try {
  await c.query("SET FOREIGN_KEY_CHECKS = 0");

  console.log("Adding supplier status (soft delete)...");
  if (!(await columnExists("suppliers", "status"))) {
    await c.query(
      "ALTER TABLE suppliers ADD COLUMN status ENUM('Active','Inactive','Blacklisted') NOT NULL DEFAULT 'Active' AFTER phone_no"
    );
    log("added suppliers.status");
  }
  if (!(await columnExists("suppliers", "updated_at"))) {
    await c.query(
      "ALTER TABLE suppliers ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
    );
    log("added suppliers.updated_at");
  }

  console.log("Adding product_supplied.updated_at...");
  if (!(await columnExists("product_supplied", "updated_at"))) {
    await c.query(
      "ALTER TABLE product_supplied ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER purchase_cost"
    );
    log("added product_supplied.updated_at");
  }

  console.log("Creating supply_audit_log table...");
  if (!(await tableExists("supply_audit_log"))) {
    await c.query(`
      CREATE TABLE supply_audit_log (
        audit_id    INT          NOT NULL AUTO_INCREMENT,
        user_id     INT          NOT NULL,
        supply_id   INT          NOT NULL,
        field_name  VARCHAR(50)  NOT NULL,
        old_value   VARCHAR(255),
        new_value   VARCHAR(255),
        changed_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (audit_id),
        KEY idx_audit_supply (supply_id),
        KEY idx_audit_user (user_id),
        CONSTRAINT fk_audit_user
          FOREIGN KEY (user_id) REFERENCES users (user_id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_audit_supply
          FOREIGN KEY (supply_id) REFERENCES product_supplied (id)
          ON UPDATE CASCADE ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    log("created supply_audit_log");
  }

  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\nSupply audit + soft-delete migration completed.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await c.end();
}
