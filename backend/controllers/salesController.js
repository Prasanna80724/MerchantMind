import db from "../config/db.js";
import {
  assertProductExists,
  getStock,
  parsePositiveInt,
  sendError,
} from "../validators/businessRules.js";

export const recordSale = async (req, res) => {
  const user_id = req.user.user_id;
  const { product_id, quantity, customer_name, payment_method } = req.body;

  if (!product_id || quantity == null) {
    return res.status(400).json({ error: "product_id and quantity are required" });
  }

  let qty;
  try {
    qty = parsePositiveInt(quantity, "Quantity");
    const product = await assertProductExists(db, user_id, product_id);
    const unitPrice = Number(product.price);

    await db.beginTransaction();

    const stock = await getStock(db, user_id, product_id, { forUpdate: true });
    if (stock < qty) {
      await db.rollback();
      return res.status(409).json({ error: "Insufficient inventory available." });
    }

    const total_price = Math.round(unitPrice * qty * 100) / 100;

    await db.query(
      `INSERT INTO sales (user_id, product_id, quantity, total_price, customer_name, payment_method, sales_date)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, product_id, qty, total_price, customer_name || null, payment_method || null]
    );

    await db.query(
      `UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = ? AND user_id = ?`,
      [qty, product_id, user_id]
    );

    await db.commit();

    const remaining = await getStock(db, user_id, product_id);
    res.status(201).json({
      message: "Sale recorded successfully",
      product_id,
      quantity: qty,
      unit_price: unitPrice,
      total_price,
      remaining_stock: remaining,
    });
  } catch (err) {
    await db.rollback();
    console.error("Error recording sale:", err);
    if (err.message === "Insufficient inventory available.") {
      return res.status(409).json({ error: err.message });
    }
    return sendError(res, err, "Failed to record sale");
  }
};

export const getSales = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT s.*, p.p_name
       FROM sales s
       INNER JOIN products p ON s.product_id = p.product_id AND s.user_id = p.user_id
       WHERE s.user_id = ?
       ORDER BY s.sales_date DESC`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching sales:", err);
    return sendError(res, err, "Failed to fetch sales");
  }
};

export const getSalesReport = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT DATE(sales_date) AS sales_date, SUM(total_price) AS total_sales
       FROM sales WHERE user_id = ?
       GROUP BY DATE(sales_date) ORDER BY sales_date`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching sales report:", err);
    return sendError(res, err, "Failed to fetch sales report");
  }
};

export const getTotalSales = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      "SELECT COALESCE(SUM(total_price), 0) AS total_sales FROM sales WHERE user_id = ?",
      [user_id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching total sales:", err);
    return sendError(res, err, "Failed to fetch total sales");
  }
};

export const deleteSale = async (req, res) => {
  return res.status(403).json({
    error: "Deleting sales records is not allowed. Sales history must be preserved for audit integrity.",
  });
};
