import db from "../config/db.js";
import {
  assertCanDeleteProduct,
  sendError,
} from "../validators/businessRules.js";

export const getInventory = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      `SELECT p.product_id, p.p_name, p.description, p.category, p.price, p.threshold, p.image_url,
              COALESCE(i.quantity, 0) AS quantity,
              i.updated_at
       FROM products p
       LEFT JOIN inventory i ON p.product_id = i.product_id AND p.user_id = i.user_id
       WHERE p.user_id = ?
       ORDER BY p.p_name`,
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    return sendError(res, err, "Failed to fetch inventory");
  }
};

export const getTotalStock = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      "SELECT COALESCE(SUM(quantity), 0) AS total_stock FROM inventory WHERE user_id = ?",
      [user_id]
    );
    res.json({ total_stock: rows[0].total_stock });
  } catch (err) {
    console.error("Error fetching total stock:", err);
    return sendError(res, err, "Failed to fetch total stock");
  }
};

export const deleteProduct = async (req, res) => {
  const user_id = req.user.user_id;
  const product_id = Number.parseInt(req.params.id, 10);

  if (!Number.isFinite(product_id)) {
    return res.status(400).json({ error: "Invalid product_id" });
  }

  try {
    await assertCanDeleteProduct(db, user_id, product_id);

    await db.beginTransaction();

    await db.query(
      "DELETE FROM inventory WHERE product_id = ? AND user_id = ?",
      [product_id, user_id]
    );

    const [result] = await db.query(
      "DELETE FROM products WHERE product_id = ? AND user_id = ?",
      [product_id, user_id]
    );

    if (result.affectedRows === 0) {
      await db.rollback();
      return res.status(404).json({ error: "Product not found" });
    }

    await db.commit();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    await db.rollback();
    console.error("Error deleting product:", err);
    return sendError(res, err, "Failed to delete product");
  }
};

export const updateProduct = async (req, res) => {
  const user_id = req.user.user_id;
  const { product_id, p_name, description, category, price, threshold, image_url } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: "product_id is required" });
  }

  try {
    const [result] = await db.query(
      `UPDATE products
       SET p_name = COALESCE(?, p_name),
           description = COALESCE(?, description),
           category = COALESCE(?, category),
           price = COALESCE(?, price),
           threshold = COALESCE(?, threshold),
           image_url = COALESCE(?, image_url)
       WHERE product_id = ? AND user_id = ?`,
      [p_name, description, category, price, threshold, image_url, product_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product updated successfully" });
  } catch (err) {
    console.error("Error updating product:", err);
    return sendError(res, err, "Failed to update product");
  }
};
