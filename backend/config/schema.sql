-- ============================================================================
--  merchantmind  —  MULTI-USER INVENTORY WORKFLOW SCHEMA
-- ============================================================================
--  Workflow: Products → Suppliers → Supply → Inventory → Sales → Reports
--
--  * Products are catalog entries (no stock at creation; stock starts at 0).
--  * Stock enters inventory ONLY through product_supplied (supply transactions).
--  * Sales decrement inventory; insufficient stock is rejected in application code.
--  * supplier_id lives on supply records, NOT on products.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS product_supplied;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id           INT          NOT NULL AUTO_INCREMENT,
  username          VARCHAR(100) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  password          VARCHAR(255) NOT NULL,
  company_name      VARCHAR(255) NOT NULL DEFAULT 'My Company',
  company_address   TEXT,
  company_phone     VARCHAR(50),
  company_gst       VARCHAR(50),
  company_website   VARCHAR(255),
  company_logo_url  VARCHAR(500),
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE suppliers (
  supplier_id INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(255),
  phone_no    VARCHAR(50),
  status      ENUM('Active','Inactive','Blacklisted') NOT NULL DEFAULT 'Active',
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id),
  UNIQUE KEY uq_suppliers_owner (supplier_id, user_id),
  KEY idx_suppliers_user (user_id),
  CONSTRAINT fk_suppliers_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products: catalog only. No supplier_id. Stock is tracked in inventory (starts at 0).
CREATE TABLE products (
  product_id  INT           NOT NULL,
  user_id     INT           NOT NULL,
  p_name      VARCHAR(150)  NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  threshold   INT           NOT NULL DEFAULT 0,
  image_url   VARCHAR(500),
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, user_id),
  KEY idx_products_user (user_id),
  CONSTRAINT fk_products_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inventory: one row per product per user. quantity >= 0 enforced.
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
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT chk_inventory_quantity_nonneg CHECK (quantity >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Supply: the ONLY way stock enters inventory (enforced in application layer).
CREATE TABLE product_supplied (
  id            INT           NOT NULL AUTO_INCREMENT,
  user_id       INT           NOT NULL,
  product_id    INT           NOT NULL,
  supplier_id   INT           NOT NULL,
  quantity      INT           NOT NULL,
  supplied_date DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  purchase_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ps_user (user_id),
  KEY idx_ps_product_owner (product_id, user_id),
  KEY idx_ps_supplier_owner (supplier_id, user_id),
  CONSTRAINT fk_ps_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_ps_product
    FOREIGN KEY (product_id, user_id) REFERENCES products (product_id, user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_ps_supplier
    FOREIGN KEY (supplier_id, user_id) REFERENCES suppliers (supplier_id, user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_supply_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Immutable audit trail for supply transaction edits (records are never deleted).
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_sale_quantity_positive CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE purchase_orders (
  po_id                   INT          NOT NULL AUTO_INCREMENT,
  user_id                 INT          NOT NULL,
  product_id              INT          NOT NULL,
  supplier_id             INT          NOT NULL,
  po_number               VARCHAR(20),
  reorder_quantity        INT          NOT NULL DEFAULT 10,
  expected_delivery_date  DATE,
  document_pdf            LONGBLOB,
  status                  VARCHAR(20)  NOT NULL DEFAULT 'Pending',
  created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (po_id),
  KEY idx_po_user (user_id),
  KEY idx_po_product_owner (product_id, user_id),
  KEY idx_po_supplier_owner (supplier_id, user_id),
  CONSTRAINT fk_po_user
    FOREIGN KEY (user_id) REFERENCES users (user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_po_product
    FOREIGN KEY (product_id, user_id) REFERENCES products (product_id, user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_po_supplier
    FOREIGN KEY (supplier_id, user_id) REFERENCES suppliers (supplier_id, user_id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
