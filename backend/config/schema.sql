-- ============================================================================
--  merchantmind  —  MULTI-USER SOURCE-OF-TRUTH SCHEMA
-- ============================================================================
--  This schema is REBUILT to match the ACTUAL running backend (the Express
--  controllers, routes and the React pages are the source of truth), and then
--  made multi-user.
--
--  Real entities used by the application:
--    users            - auth / tenant root
--    suppliers        - per-user suppliers          (name, email, phone_no)
--    products         - per-user catalog            (p_name, category, price,
--                                                     threshold, supplier_id)
--    inventory        - per-user stock per product  (quantity)
--    product_supplied - per-user supply events      (quantity, purchase_cost)
--    sales            - per-user sales              (sales_date, total_price...)
--    invoices         - per-user low-stock invoices (invoice_file_path BLOB)
--
--  Reports (sales-report / monthly-stats) are COMPUTED on the fly from `sales`
--  and `product_supplied`, so there is no report table — scoping those queries
--  by user_id is what makes reports per-user.
--
--  Ownership model:
--    * `users` is the owner table. PK = users.user_id.
--    * Every table holding user-owned data carries a `user_id` FK -> users.
--    * Cross-user references are made IMPOSSIBLE via COMPOSITE foreign keys
--      (e.g. inventory/sales/product_supplied/invoices can only point at a
--       product or supplier that belongs to the SAME user_id).
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Drop in reverse-dependency order so the file is idempotent / re-runnable.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS product_supplied;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

-- ===========================================================================
-- 1) users  — OWNER TABLE (tenant root).
--    password now stores a bcrypt hash (<= 60 chars, 255 leaves headroom).
-- ===========================================================================
CREATE TABLE users (
  user_id    INT          NOT NULL AUTO_INCREMENT,
  username   VARCHAR(100) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 2) suppliers  — user_id ADDED. (matches addSupplier: name, email, phone_no)
--    Composite UNIQUE (supplier_id, user_id) lets child tables reference a
--    supplier WHILE pinning the owning user, blocking cross-user references.
-- ===========================================================================
CREATE TABLE suppliers (
  supplier_id INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255),
  phone_no    VARCHAR(50),
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id),
  UNIQUE KEY uq_suppliers_owner (supplier_id, user_id),
  KEY idx_suppliers_user (user_id),
  CONSTRAINT fk_suppliers_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 3) products  — user_id ADDED. (matches addProducts: product_id supplied by
--    the app, p_name, category, price, threshold, supplier_id)
--    PK is composite (product_id, user_id) so two users may reuse a product_id
--    and ownership stays isolated. supplier_id is pinned to the SAME user.
-- ===========================================================================
CREATE TABLE products (
  product_id  INT           NOT NULL,
  user_id     INT           NOT NULL,
  p_name      VARCHAR(150)  NOT NULL,
  category    VARCHAR(100),
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  threshold   INT           NOT NULL DEFAULT 0,
  supplier_id INT           NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, user_id),
  KEY idx_products_user (user_id),
  KEY idx_products_supplier_owner (supplier_id, user_id),
  CONSTRAINT fk_products_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_products_supplier
    FOREIGN KEY (supplier_id, user_id) REFERENCES suppliers (supplier_id, user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 4) inventory  — user_id ADDED. (matches addProducts/getInventory: stock per
--    product). One stock row per product per user.
-- ===========================================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 5) product_supplied  — user_id ADDED. (matches addSupplier / dashboard:
--    quantity, supplied_date, purchase_cost). BOTH the supplier and product
--    are pinned to the row's user_id, so user A can never map user B's records.
-- ===========================================================================
CREATE TABLE product_supplied (
  id            INT           NOT NULL AUTO_INCREMENT,
  user_id       INT           NOT NULL,
  product_id    INT           NOT NULL,
  supplier_id   INT           NOT NULL,
  quantity      INT           NOT NULL DEFAULT 0,
  supplied_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  purchase_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_ps_user (user_id),
  KEY idx_ps_product_owner (product_id, user_id),
  KEY idx_ps_supplier_owner (supplier_id, user_id),
  CONSTRAINT fk_ps_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ps_product
    FOREIGN KEY (product_id, user_id) REFERENCES products (product_id, user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ps_supplier
    FOREIGN KEY (supplier_id, user_id) REFERENCES suppliers (supplier_id, user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 6) sales  — user_id ADDED. (matches recordSale/getSales/SalesPage:
--    sales_id, product_id, quantity, total_price, customer_name, sales_date,
--    payment_method). product_id is pinned to the same user.
-- ===========================================================================
CREATE TABLE sales (
  sales_id       INT           NOT NULL AUTO_INCREMENT,
  user_id        INT           NOT NULL,
  product_id     INT           NOT NULL,
  quantity       INT           NOT NULL,
  total_price    DECIMAL(10,2) NOT NULL,
  customer_name  VARCHAR(150),
  payment_method VARCHAR(50),
  sales_date     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sales_id),
  KEY idx_sales_user (user_id),
  KEY idx_sales_product_owner (product_id, user_id),
  KEY idx_sales_user_date (user_id, sales_date),
  CONSTRAINT fk_sales_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_sales_product
    FOREIGN KEY (product_id, user_id) REFERENCES products (product_id, user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===========================================================================
-- 7) invoices  — user_id ADDED. (matches the cron generator + invoiceController:
--    invoice_id, product_id, supplier_id, invoice_file_path BLOB, status).
--    The PDF/"uploaded image" lives in invoice_file_path and is now owner-scoped
--    so no user can view or act on another user's invoice file.
-- ===========================================================================
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
