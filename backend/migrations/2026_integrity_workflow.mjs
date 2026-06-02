// ============================================================================
//  Integrity workflow migration — products catalog + supply-only stock
//
//  * Adds products.description, products.image_url
//  * Removes products.supplier_id (supplier linked via product_supplied only)
//  * Adds CHECK constraints where supported
//
//  Run: node backend/migrations/2026_integrity_workflow.mjs
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

const constraintExists = async (name) => {
  const [r] = await c.query(
    "SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA=? AND CONSTRAINT_NAME=?",
    [DB, name]
  );
  return r[0].n > 0;
};

try {
  await c.query("SET FOREIGN_KEY_CHECKS = 0");

  console.log("Adding product catalog columns...");
  if (!(await columnExists("products", "description"))) {
    await c.query("ALTER TABLE products ADD COLUMN description TEXT NULL AFTER p_name");
    log("added products.description");
  }
  if (!(await columnExists("products", "image_url"))) {
    await c.query("ALTER TABLE products ADD COLUMN image_url VARCHAR(500) NULL AFTER threshold");
    log("added products.image_url");
  }

  console.log("Removing legacy products columns...");
  if ((await columnExists("products", "name")) && (await columnExists("products", "p_name"))) {
    await c.query(
      "UPDATE products SET p_name = name WHERE (p_name IS NULL OR p_name = '') AND name IS NOT NULL AND name != ''"
    );
    log("synced p_name from legacy name");
  }
  if (await columnExists("products", "name")) {
    await c.query("ALTER TABLE products DROP COLUMN name");
    log("dropped legacy products.name");
  }
  if (await columnExists("products", "stock")) {
    await c.query("ALTER TABLE products DROP COLUMN stock");
    log("dropped legacy products.stock (stock lives in inventory)");
  }

  console.log("Removing supplier_id from products (supplier via supply only)...");
  if (await columnExists("products", "supplier_id")) {
    const [fks] = await c.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA=? AND TABLE_NAME='products' AND COLUMN_NAME='supplier_id'
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [DB]
    );
    for (const fk of fks) {
      await c.query(`ALTER TABLE products DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
      log(`dropped FK ${fk.CONSTRAINT_NAME}`);
    }
    await c.query("ALTER TABLE products DROP COLUMN supplier_id");
    log("dropped products.supplier_id");
  }

  console.log("Adding integrity CHECK constraints...");
  if (!(await constraintExists("chk_inventory_quantity_nonneg"))) {
    try {
      await c.query(
        "ALTER TABLE inventory ADD CONSTRAINT chk_inventory_quantity_nonneg CHECK (quantity >= 0)"
      );
      log("added chk_inventory_quantity_nonneg");
    } catch (e) {
      log(`skipped inventory CHECK: ${e.message}`);
    }
  }
  if (!(await constraintExists("chk_supply_quantity_positive"))) {
    try {
      await c.query(
        "ALTER TABLE product_supplied ADD CONSTRAINT chk_supply_quantity_positive CHECK (quantity > 0)"
      );
      log("added chk_supply_quantity_positive");
    } catch (e) {
      log(`skipped supply CHECK: ${e.message}`);
    }
  }
  if (!(await constraintExists("chk_sale_quantity_positive"))) {
    try {
      await c.query(
        "ALTER TABLE sales ADD CONSTRAINT chk_sale_quantity_positive CHECK (quantity > 0)"
      );
      log("added chk_sale_quantity_positive");
    } catch (e) {
      log(`skipped sales CHECK: ${e.message}`);
    }
  }

  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\nIntegrity workflow migration completed successfully.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exitCode = 1;
} finally {
  await c.end();
}
