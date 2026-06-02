// ============================================================================
//  Non-destructive migration: align the EXISTING merchantmind database with the
//  realigned multi-user schema/code (schema.sql).
//
//  It is idempotent — each step checks current state, so it is safe to re-run.
//
//  What it does (preserving all existing data):
//    * drops the 4 legacy triggers (stock/report are now handled in app code,
//      and they referenced the columns we rename below)
//    * supplier            -> suppliers          (+ phone -> phone_no)
//    * supplier_product    -> product_supplied    (+ quantity_supplied -> quantity,
//                                                   supply_date -> supplied_date,
//                                                   + purchase_cost)
//    * sales.sale_id       -> sales_id
//    * sales.sale_date     -> sales_date
//    * products            + p_name (copied from name) + threshold
//    * creates `inventory`  and copies products.stock into it
//    * creates `invoices`
//
//  Run with:  node backend/migrations/2026_realign_multiuser.mjs
// ============================================================================
import mysql from "mysql2/promise";

const DB = "merchantmind";
const c = await mysql.createConnection({
  host: "localhost",
  user: "Prasanna",
  password: "2006",
  database: DB,
  multipleStatements: true,
});

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

  // 1) Drop legacy triggers ---------------------------------------------------
  console.log("Dropping legacy triggers...");
  for (const trg of [
    "after_sales_insert",
    "after_sales_update",
    "after_sales_delete",
    "update_product_stock_after_supply",
    "after_sale_insert",
    "after_sale_delete",
  ]) {
    await c.query(`DROP TRIGGER IF EXISTS \`${trg}\``);
    log(`dropped ${trg} (if existed)`);
  }

  // 2) supplier -> suppliers --------------------------------------------------
  console.log("Migrating supplier -> suppliers...");
  if ((await tableExists("supplier")) && !(await tableExists("suppliers"))) {
    await c.query("RENAME TABLE supplier TO suppliers");
    log("renamed table supplier -> suppliers");
  } else {
    log("suppliers already present, skipping rename");
  }
  if ((await columnExists("suppliers", "phone")) && !(await columnExists("suppliers", "phone_no"))) {
    await c.query("ALTER TABLE suppliers CHANGE COLUMN phone phone_no VARCHAR(50) NULL");
    log("renamed suppliers.phone -> phone_no");
  } else {
    log("suppliers.phone_no already present, skipping");
  }

  // 3) supplier_product -> product_supplied -----------------------------------
  console.log("Migrating supplier_product -> product_supplied...");
  if ((await tableExists("supplier_product")) && !(await tableExists("product_supplied"))) {
    await c.query("RENAME TABLE supplier_product TO product_supplied");
    log("renamed table supplier_product -> product_supplied");
  } else {
    log("product_supplied already present, skipping rename");
  }
  if ((await columnExists("product_supplied", "quantity_supplied")) && !(await columnExists("product_supplied", "quantity"))) {
    await c.query("ALTER TABLE product_supplied CHANGE COLUMN quantity_supplied quantity INT NOT NULL DEFAULT 0");
    log("renamed product_supplied.quantity_supplied -> quantity");
  } else {
    log("product_supplied.quantity already present, skipping");
  }
  if ((await columnExists("product_supplied", "supply_date")) && !(await columnExists("product_supplied", "supplied_date"))) {
    await c.query("ALTER TABLE product_supplied CHANGE COLUMN supply_date supplied_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    log("renamed product_supplied.supply_date -> supplied_date");
  } else {
    log("product_supplied.supplied_date already present, skipping");
  }
  if (!(await columnExists("product_supplied", "purchase_cost"))) {
    await c.query("ALTER TABLE product_supplied ADD COLUMN purchase_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    log("added product_supplied.purchase_cost");
  } else {
    log("product_supplied.purchase_cost already present, skipping");
  }

  // 4) sales column renames ---------------------------------------------------
  console.log("Migrating sales columns...");
  if ((await columnExists("sales", "sale_id")) && !(await columnExists("sales", "sales_id"))) {
    await c.query("ALTER TABLE sales CHANGE COLUMN sale_id sales_id INT NOT NULL AUTO_INCREMENT");
    log("renamed sales.sale_id -> sales_id");
  } else {
    log("sales.sales_id already present, skipping");
  }
  if ((await columnExists("sales", "sale_date")) && !(await columnExists("sales", "sales_date"))) {
    await c.query("ALTER TABLE sales CHANGE COLUMN sale_date sales_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
    log("renamed sales.sale_date -> sales_date");
  } else {
    log("sales.sales_date already present, skipping");
  }

  // 5) products: add p_name + threshold ---------------------------------------
  console.log("Migrating products...");
  if (!(await columnExists("products", "p_name"))) {
    await c.query("ALTER TABLE products ADD COLUMN p_name VARCHAR(150) NOT NULL DEFAULT '' AFTER user_id");
    if (await columnExists("products", "name")) {
      await c.query("UPDATE products SET p_name = name WHERE (p_name IS NULL OR p_name = '')");
      log("added products.p_name and copied from name");
    } else {
      log("added products.p_name (no legacy name column to copy)");
    }
  } else {
    log("products.p_name already present, skipping");
  }
  if (!(await columnExists("products", "threshold"))) {
    await c.query("ALTER TABLE products ADD COLUMN threshold INT NOT NULL DEFAULT 0");
    log("added products.threshold");
  } else {
    log("products.threshold already present, skipping");
  }

  // 6) inventory (created from products.stock) --------------------------------
  console.log("Creating inventory...");
  if (!(await tableExists("inventory"))) {
    await c.query(`
      CREATE TABLE inventory (
        product_id INT       NOT NULL,
        user_id    INT       NOT NULL,
        quantity   INT       NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (product_id, user_id),
        KEY idx_inventory_user (user_id),
        CONSTRAINT fk_inventory_user
          FOREIGN KEY (user_id) REFERENCES users (user_id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_inventory_product
          FOREIGN KEY (product_id, user_id) REFERENCES products (product_id, user_id)
          ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    log("created inventory table");
    if (await columnExists("products", "stock")) {
      const [r] = await c.query(
        "INSERT INTO inventory (product_id, user_id, quantity) SELECT product_id, user_id, stock FROM products"
      );
      log(`seeded inventory from products.stock (${r.affectedRows} rows)`);
    }
  } else {
    log("inventory already present, skipping");
  }

  // 7) invoices ---------------------------------------------------------------
  console.log("Creating invoices...");
  if (!(await tableExists("invoices"))) {
    await c.query(`
      CREATE TABLE invoices (
        invoice_id        INT          NOT NULL AUTO_INCREMENT,
        user_id           INT          NOT NULL,
        product_id        INT          NOT NULL,
        supplier_id       INT          NOT NULL,
        invoice_file_path LONGBLOB,
        status            VARCHAR(20)  NOT NULL DEFAULT 'Pending',
        created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (invoice_id),
        KEY idx_invoices_user (user_id),
        KEY idx_invoices_product_owner (product_id, user_id),
        KEY idx_invoices_supplier_owner (supplier_id, user_id),
        CONSTRAINT fk_invoices_user
          FOREIGN KEY (user_id) REFERENCES users (user_id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_invoices_product
          FOREIGN KEY (product_id, user_id) REFERENCES products (product_id, user_id)
          ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT fk_invoices_supplier
          FOREIGN KEY (supplier_id, user_id) REFERENCES suppliers (supplier_id, user_id)
          ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    log("created invoices table");
  } else {
    log("invoices already present, skipping");
  }

  await c.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\nMigration completed successfully.");
} catch (err) {
  console.error("\nMigration FAILED:", err.code || "", err.sqlMessage || err.message);
  process.exitCode = 1;
} finally {
  await c.end();
}
