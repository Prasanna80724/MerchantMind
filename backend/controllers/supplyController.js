import db from "../config/db.js";
import {
  assertActiveSupplier,
  assertProductExists,
  assertSupplyExists,
  applyStockDelta,
  ensureInventoryRow,
  getStock,
  increaseStock,
  logSupplyAudit,
  parseNonNegativeNumber,
  parsePositiveInt,
  sendError,
} from "../validators/businessRules.js";

/** Record a supply transaction — the ONLY way to add stock. */
export const recordSupply = async (req, res) => {
  const user_id = req.user.user_id;
  const { supplier_id, product_id, quantity, purchase_cost, supplied_date } = req.body;

  if (!supplier_id || !product_id || quantity == null || purchase_cost == null) {
    return res.status(400).json({ error: "supplier_id, product_id, quantity, and purchase_cost are required" });
  }

  let qty;
  let cost;
  try {
    qty = parsePositiveInt(quantity, "Quantity");
    cost = parseNonNegativeNumber(purchase_cost, "Purchase cost");
    await assertActiveSupplier(db, user_id, supplier_id);
    await assertProductExists(db, user_id, product_id);
  } catch (err) {
    return sendError(res, err);
  }

  const supplyDate = supplied_date ? new Date(supplied_date) : new Date();
  if (Number.isNaN(supplyDate.getTime())) {
    return res.status(400).json({ error: "Invalid supplied_date" });
  }

  try {
    await db.beginTransaction();

    const [result] = await db.query(
      `INSERT INTO product_supplied (user_id, product_id, supplier_id, quantity, supplied_date, purchase_cost)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, product_id, supplier_id, qty, supplyDate, cost]
    );

    await increaseStock(db, user_id, product_id, qty);

    await logSupplyAudit(db, user_id, result.insertId, "created", null, `qty=${qty}, cost=${cost}`);

    await db.commit();

    const newStock = await getStock(db, user_id, product_id);
    res.status(201).json({
      message: "Supply recorded and inventory updated",
      id: result.insertId,
      product_id,
      supplier_id,
      quantity_added: qty,
      current_stock: newStock,
    });
  } catch (err) {
    await db.rollback();
    console.error("Error recording supply:", err);
    return sendError(res, err, "Failed to record supply");
  }
};

/** Edit supply transaction — adjusts inventory when quantity changes. */
export const updateSupply = async (req, res) => {
  const user_id = req.user.user_id;
  const supply_id = Number.parseInt(req.params.id, 10);
  const { quantity, purchase_cost, supplied_date } = req.body;

  if (!Number.isFinite(supply_id)) {
    return res.status(400).json({ error: "Invalid supply id" });
  }
  if (quantity == null && purchase_cost == null && supplied_date == null) {
    return res.status(400).json({ error: "At least one of quantity, purchase_cost, or supplied_date is required" });
  }

  try {
    await db.beginTransaction();

    const existing = await assertSupplyExists(db, user_id, supply_id);
    const updates = [];
    const params = [];

    if (quantity != null) {
      const newQty = parsePositiveInt(quantity, "Quantity");
      const delta = newQty - Number(existing.quantity);
      if (delta !== 0) {
        await applyStockDelta(db, user_id, existing.product_id, delta);
        await logSupplyAudit(db, user_id, supply_id, "quantity", existing.quantity, newQty);
      }
      updates.push("quantity = ?");
      params.push(newQty);
    }

    if (purchase_cost != null) {
      const newCost = parseNonNegativeNumber(purchase_cost, "Purchase cost");
      if (Number(existing.purchase_cost) !== newCost) {
        await logSupplyAudit(db, user_id, supply_id, "purchase_cost", existing.purchase_cost, newCost);
      }
      updates.push("purchase_cost = ?");
      params.push(newCost);
    }

    if (supplied_date != null) {
      const newDate = new Date(supplied_date);
      if (Number.isNaN(newDate.getTime())) {
        await db.rollback();
        return res.status(400).json({ error: "Invalid supplied_date" });
      }
      const oldDateStr = new Date(existing.supplied_date).toISOString();
      const newDateStr = newDate.toISOString();
      if (oldDateStr !== newDateStr) {
        await logSupplyAudit(db, user_id, supply_id, "supplied_date", oldDateStr, newDateStr);
      }
      updates.push("supplied_date = ?");
      params.push(newDate);
    }

    if (updates.length > 0) {
      params.push(supply_id, user_id);
      await db.query(
        `UPDATE product_supplied SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`,
        params
      );
    }

    await db.commit();

    const currentStock = await getStock(db, user_id, existing.product_id);
    const [rows] = await db.query(
      `SELECT ps.*, s.name AS supplier_name, p.p_name
       FROM product_supplied ps
       INNER JOIN suppliers s ON s.supplier_id = ps.supplier_id AND s.user_id = ps.user_id
       INNER JOIN products p ON p.product_id = ps.product_id AND p.user_id = ps.user_id
       WHERE ps.id = ? AND ps.user_id = ?`,
      [supply_id, user_id]
    );

    res.json({
      message: "Supply transaction updated",
      supply: rows[0],
      current_stock: currentStock,
    });
  } catch (err) {
    await db.rollback();
    console.error("Error updating supply:", err);
    return sendError(res, err, "Failed to update supply transaction");
  }
};

/** Audit log for a supply transaction. */
export const getSupplyAuditLog = async (req, res) => {
  const user_id = req.user.user_id;
  const supply_id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(supply_id)) {
    return res.status(400).json({ error: "Invalid supply id" });
  }

  try {
    await assertSupplyExists(db, user_id, supply_id);
    const [rows] = await db.query(
      `SELECT audit_id, field_name, old_value, new_value, changed_at
       FROM supply_audit_log
       WHERE supply_id = ? AND user_id = ?
       ORDER BY changed_at DESC`,
      [supply_id, user_id]
    );
    res.json(rows);
  } catch (err) {
    return sendError(res, err, "Failed to fetch audit log");
  }
};

/** List supply transactions for the logged-in user. */
export const getSupplies = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT ps.*, s.name AS supplier_name, s.status AS supplier_status, p.p_name
       FROM product_supplied ps
       INNER JOIN suppliers s ON s.supplier_id = ps.supplier_id AND s.user_id = ps.user_id
       INNER JOIN products p ON p.product_id = ps.product_id AND p.user_id = ps.user_id
       WHERE ps.user_id = ?
       ORDER BY ps.supplied_date DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching supplies:", err);
    return sendError(res, err, "Failed to fetch supply records");
  }
};

/** Supply records cannot be deleted — use edit instead. */
export const deleteSupply = async (req, res) => {
  return res.status(403).json({
    error: "Deleting supply transactions is not allowed. Edit the transaction to correct mistakes.",
  });
};
