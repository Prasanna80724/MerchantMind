import db from "../config/db.js";
import {
  ensureInventoryRow,
  parseNonNegativeNumber,
  sendError,
} from "../validators/businessRules.js";

/** Create product catalog entry with zero stock. Stock enters ONLY via supply. */
export const addProducts = async (req, res) => {
  const user_id = req.user.user_id;
  const { product_id, p_name, description, category, price, threshold, image_url } = req.body;

  if (!product_id || !p_name || !category || !description || price == null || threshold == null || !image_url) {
    return res.status(400).json({
      error: "Missing required fields: product_id, p_name, category, description, price, threshold, image_url",
    });
  }

  let parsedPrice;
  let parsedThreshold;
  try {
    parsedPrice = parseNonNegativeNumber(price, "Price");
    parsedThreshold = parseNonNegativeNumber(threshold, "Threshold");
  } catch (err) {
    return sendError(res, err);
  }

  try {
    await db.beginTransaction();

    const [existing] = await db.query(
      "SELECT product_id FROM products WHERE product_id = ? AND user_id = ?",
      [product_id, user_id]
    );
    if (existing.length > 0) {
      await db.rollback();
      return res.status(409).json({ error: "Product already exists", product_id });
    }

    await db.query(
      `INSERT INTO products (product_id, user_id, p_name, description, category, price, threshold, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id, user_id, p_name, description, category, parsedPrice, parsedThreshold, image_url]
    );

    await ensureInventoryRow(db, user_id, product_id);

    await db.commit();
    res.status(201).json({
      message: "Product created with zero stock. Record a supply transaction to add inventory.",
      product_id,
    });
  } catch (err) {
    await db.rollback();
    console.error("Error adding product:", err);
    return sendError(res, err, "Failed to create product");
  }
};

/** Direct inventory adjustment is disabled — use POST /record-supply instead. */
export const addinventory = async (req, res) => {
  return res.status(403).json({
    error: "Direct inventory adjustment is not allowed. Record a supply transaction to add stock.",
  });
};

/** Product catalog with current stock (for dropdowns). */
export const getProductsCatalog = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT p.product_id, p.p_name, p.description, p.category, p.price, p.threshold, p.image_url,
              COALESCE(i.quantity, 0) AS quantity
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id AND p.user_id = i.user_id
       WHERE p.user_id = ?
       ORDER BY p.p_name`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching product catalog:", err);
    return sendError(res, err, "Failed to fetch products");
  }
};

export const getTopSellingProducts = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT p.p_name, SUM(s.quantity) AS total_sold
       FROM sales s
       JOIN products p ON s.product_id = p.product_id AND s.user_id = p.user_id
       WHERE s.user_id = ?
       GROUP BY p.product_id, p.p_name
       ORDER BY total_sold DESC
       LIMIT 5`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching top-selling products:", error);
    res.status(500).json({ error: "Error fetching top-selling products", details: error.message });
  }
};

export const getProductSales = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT p.p_name AS product_name,
              COALESCE(SUM(s.quantity), 0) AS total_sold,
              COALESCE(i.quantity, 0) AS remaining_stock
       FROM products p
       LEFT JOIN sales s ON p.product_id = s.product_id AND p.user_id = s.user_id
       LEFT JOIN inventory i ON p.product_id = i.product_id AND p.user_id = i.user_id
       WHERE p.user_id = ?
       GROUP BY p.product_id, p.p_name, i.quantity
       ORDER BY p.p_name`,
      [user_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching product sales data:", error);
    res.status(500).json({ error: "Error fetching product sales data", details: error.message });
  }
};
