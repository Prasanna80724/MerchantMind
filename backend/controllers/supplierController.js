import db from "../config/db.js";
import {
  assertCanDeleteSupplier,
  assertSupplierExists,
  parseSupplierStatus,
  sendError,
} from "../validators/businessRules.js";

/** Active suppliers only — for supply form dropdowns. */
export const getSupp = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT supplier_id, name, email, phone_no, status
       FROM suppliers
       WHERE user_id = ? AND status = 'Active'
       ORDER BY name`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching active suppliers:", err);
    return sendError(res, err, "Failed to fetch suppliers");
  }
};

export const getSupplierAnalytics = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT s.supplier_id, s.name, s.status,
              COUNT(ps.id) AS supply_count,
              COALESCE(SUM(ps.quantity), 0) AS total_quantity,
              COALESCE(SUM(ps.purchase_cost), 0) AS total_cost
       FROM suppliers s
       LEFT JOIN product_supplied ps
         ON s.supplier_id = ps.supplier_id AND s.user_id = ps.user_id
       WHERE s.user_id = ?
       GROUP BY s.supplier_id, s.name, s.status
       ORDER BY s.name`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching supplier analytics:", err);
    return sendError(res, err, "Failed to fetch supplier analytics");
  }
};

export const getTotalPurchaseCost = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      "SELECT COALESCE(SUM(purchase_cost), 0) AS total_purchase FROM product_supplied WHERE user_id = ?",
      [user_id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching total purchase cost:", err);
    return sendError(res, err, "Failed to fetch purchase cost");
  }
};

export const addSupplier = async (req, res) => {
  const user_id = req.user.user_id;
  const { name, email, phone, phone_no } = req.body;
  const phoneNumber = phone_no || phone;

  if (!name) {
    return res.status(400).json({ error: "Supplier name is required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO suppliers (user_id, name, email, phone_no, status) VALUES (?, ?, ?, ?, 'Active')",
      [user_id, name, email || null, phoneNumber || null]
    );

    res.status(201).json({
      message: "Supplier created. Use Record Supply to add products and update inventory.",
      supplier_id: result.insertId,
      status: "Active",
    });
  } catch (err) {
    console.error("Error adding supplier:", err);
    return sendError(res, err, "Failed to create supplier");
  }
};

export const getSuppliers = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      "SELECT * FROM suppliers WHERE user_id = ? ORDER BY status = 'Active' DESC, name",
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    return sendError(res, err, "Failed to fetch suppliers");
  }
};

/** Soft-delete: set supplier status (Active / Inactive / Blacklisted). */
export const updateSupplierStatus = async (req, res) => {
  const user_id = req.user.user_id;
  const supplier_id = Number.parseInt(req.params.id, 10);
  const { status } = req.body;

  if (!Number.isFinite(supplier_id)) {
    return res.status(400).json({ error: "Invalid supplier_id" });
  }

  let newStatus;
  try {
    newStatus = parseSupplierStatus(status);
    await assertSupplierExists(db, user_id, supplier_id);
  } catch (err) {
    return sendError(res, err);
  }

  try {
    const [result] = await db.query(
      "UPDATE suppliers SET status = ? WHERE supplier_id = ? AND user_id = ?",
      [newStatus, supplier_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    res.json({
      message:
        newStatus === "Active"
          ? "Supplier reactivated"
          : newStatus === "Inactive"
            ? "Supplier deactivated"
            : "Supplier marked as blacklisted",
      supplier_id,
      status: newStatus,
    });
  } catch (err) {
    console.error("Error updating supplier status:", err);
    return sendError(res, err, "Failed to update supplier status");
  }
};

/** Hard delete is disabled — use PATCH /suppliers/:id/status instead. */
export const deleteSupplier = async (req, res) => {
  try {
    await assertCanDeleteSupplier(db, req.user.user_id, Number.parseInt(req.params.id, 10));
  } catch (err) {
    return sendError(res, err);
  }
};

export const addProductSupplied = async (req, res) => {
  return res.status(410).json({
    error: "This endpoint is deprecated. Use POST /record-supply to record supply and update inventory.",
  });
};

export const getProductSupplied = async (req, res) => {
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
    console.error("Error fetching product supplied:", err);
    return sendError(res, err, "Failed to fetch supply records");
  }
};

export const deleteProductSupplied = async (req, res) => {
  return res.status(403).json({
    error: "Deleting supply records is not allowed. Edit the supply transaction to correct mistakes.",
  });
};
