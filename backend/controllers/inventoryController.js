import db from "../config/db.js";

// Get all inventory items (scoped to the logged-in user)
export const getInventory = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query =
      "SELECT i.*, p.* FROM inventory i INNER JOIN products p ON i.product_id = p.product_id AND i.user_id = p.user_id WHERE i.user_id = ?";
    const [results] = await db.query(query, [user_id]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    res
      .status(500)
      .json({ error: "Database query failed", details: err.message });
  }
};

// Get total stock (scoped to the logged-in user)
export const getTotalStock = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = `
      SELECT p.p_name, i.quantity AS stock
      FROM inventory i
      JOIN products p ON i.product_id = p.product_id AND i.user_id = p.user_id
      WHERE i.user_id = ?
    `;
    const [rows] = await db.query(query, [user_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching total stock:", error);
    res
      .status(500)
      .json({ error: "Error fetching total stock", details: error.message });
  }
};

// Delete a product from inventory (scoped to the logged-in user)
export const deleteProduct = async (req, res) => {
  const user_id = req.user.user_id;
  const productId = req.params.id;

  try {
    // Delete from inventory first
    await db.query(
      "DELETE FROM inventory WHERE product_id = ? AND user_id = ?",
      [productId, user_id]
    );

    // Now delete from products
    const [result2] = await db.query(
      "DELETE FROM products WHERE product_id = ? AND user_id = ?",
      [productId, user_id]
    );

    if (result2.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found in products" });
    }

    res.status(200).json({
      message: "Product deleted from products and inventory successfully",
    });
  } catch (err) {
    console.error("Error deleting from products:", err);
    res
      .status(500)
      .json({ error: "Error deleting from products", details: err.message });
  }
};
