/**
 * Business-rule validation helpers for inventory workflow integrity.
 * All checks are scoped by user_id (multi-tenant).
 */

export async function assertProductExists(db, userId, productId) {
  const [rows] = await db.query(
    "SELECT product_id, p_name, price FROM products WHERE product_id = ? AND user_id = ?",
    [productId, userId]
  );
  if (rows.length === 0) {
    const err = new Error("Product not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

export async function assertSupplierExists(db, userId, supplierId) {
  const [rows] = await db.query(
    "SELECT supplier_id, name, status FROM suppliers WHERE supplier_id = ? AND user_id = ?",
    [supplierId, userId]
  );
  if (rows.length === 0) {
    const err = new Error("Supplier not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

export async function assertActiveSupplier(db, userId, supplierId) {
  const supplier = await assertSupplierExists(db, userId, supplierId);
  if (supplier.status !== "Active") {
    const err = new Error("Supplier is not active. Only active suppliers can receive new supply transactions.");
    err.status = 409;
    throw err;
  }
  return supplier;
}

export async function assertSupplyExists(db, userId, supplyId) {
  const [rows] = await db.query(
    `SELECT id, product_id, supplier_id, quantity, purchase_cost, supplied_date
     FROM product_supplied WHERE id = ? AND user_id = ?`,
    [supplyId, userId]
  );
  if (rows.length === 0) {
    const err = new Error("Supply transaction not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

/** Apply a stock delta from a supply edit; rejects if inventory would go negative. */
export async function applyStockDelta(db, userId, productId, delta) {
  if (delta === 0) return;

  await ensureInventoryRow(db, userId, productId);
  const stock = await getStock(db, userId, productId, { forUpdate: true });
  const newStock = stock + delta;
  if (newStock < 0) {
    const err = new Error(
      "Cannot reduce supply quantity: would result in negative inventory. Reduce sales or adjust quantity carefully."
    );
    err.status = 409;
    throw err;
  }
  await db.query(
    `UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP
     WHERE product_id = ? AND user_id = ?`,
    [newStock, productId, userId]
  );
}

export async function logSupplyAudit(db, userId, supplyId, fieldName, oldValue, newValue) {
  const oldStr = oldValue == null ? null : String(oldValue);
  const newStr = newValue == null ? null : String(newValue);
  if (oldStr === newStr) return;

  await db.query(
    `INSERT INTO supply_audit_log (user_id, supply_id, field_name, old_value, new_value)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, supplyId, fieldName, oldStr, newStr]
  );
}

export async function getStock(db, userId, productId, { forUpdate = false } = {}) {
  const lock = forUpdate ? " FOR UPDATE" : "";
  const [rows] = await db.query(
    `SELECT quantity FROM inventory WHERE product_id = ? AND user_id = ?${lock}`,
    [productId, userId]
  );
  return rows.length ? Number(rows[0].quantity) : 0;
}

export async function assertCanDeleteProduct(db, userId, productId) {
  const [[sales]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM sales WHERE product_id = ? AND user_id = ?",
    [productId, userId]
  );
  if (Number(sales.cnt) > 0) {
    const err = new Error("Cannot delete product: sales records exist for this product.");
    err.status = 409;
    throw err;
  }

  const [[supplies]] = await db.query(
    "SELECT COUNT(*) AS cnt FROM product_supplied WHERE product_id = ? AND user_id = ?",
    [productId, userId]
  );
  if (Number(supplies.cnt) > 0) {
    const err = new Error("Cannot delete product: supply history exists for this product.");
    err.status = 409;
    throw err;
  }

  const [[inv]] = await db.query(
    "SELECT quantity FROM inventory WHERE product_id = ? AND user_id = ?",
    [productId, userId]
  );
  if (inv && Number(inv.quantity) > 0) {
    const err = new Error("Cannot delete product: inventory still has stock. Adjust stock via supply/sales first.");
    err.status = 409;
    throw err;
  }
}

export async function assertCanDeleteSupplier(db, userId, supplierId) {
  await assertSupplierExists(db, userId, supplierId);
  const err = new Error(
    "Hard deletion is not allowed. Deactivate the supplier instead to preserve supply history."
  );
  err.status = 403;
  throw err;
}

const VALID_SUPPLIER_STATUSES = ["Active", "Inactive", "Blacklisted"];

export function parseSupplierStatus(status) {
  if (!VALID_SUPPLIER_STATUSES.includes(status)) {
    const err = new Error("status must be Active, Inactive, or Blacklisted");
    err.status = 400;
    throw err;
  }
  return status;
}

export function parsePositiveInt(value, fieldName) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error(`${fieldName} must be a positive integer`);
    err.status = 400;
    throw err;
  }
  return n;
}

export function parseNonNegativeNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    const err = new Error(`${fieldName} must be a non-negative number`);
    err.status = 400;
    throw err;
  }
  return n;
}

/** Ensure inventory row exists at quantity 0 for a newly created product. */
export async function ensureInventoryRow(db, userId, productId) {
  await db.query(
    `INSERT INTO inventory (product_id, user_id, quantity)
     VALUES (?, ?, 0)
     ON DUPLICATE KEY UPDATE product_id = product_id`,
    [productId, userId]
  );
}

/** Increase stock ONLY via a supply transaction. */
export async function increaseStock(db, userId, productId, quantity) {
  await ensureInventoryRow(db, userId, productId);
  const [result] = await db.query(
    `UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
     WHERE product_id = ? AND user_id = ?`,
    [quantity, productId, userId]
  );
  if (result.affectedRows === 0) {
    const err = new Error("Failed to update inventory stock");
    err.status = 500;
    throw err;
  }
}

/** Decrease stock for a sale; throws if insufficient. */
export async function decreaseStock(db, userId, productId, quantity) {
  const stock = await getStock(db, userId, productId, { forUpdate: true });
  if (stock < quantity) {
    const err = new Error("Insufficient inventory available.");
    err.status = 409;
    throw err;
  }
  await db.query(
    `UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
     WHERE product_id = ? AND user_id = ?`,
    [quantity, productId, userId]
  );
}

export function sendError(res, err, fallback = "Operation failed") {
  const status = err.status || 500;
  return res.status(status).json({
    error: err.message || fallback,
    details: err.sqlMessage || undefined,
  });
}
