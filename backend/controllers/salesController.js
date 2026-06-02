import db from "../config/db.js";

// Get all sales (scoped to the logged-in user)
export const getSales = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(
      "SELECT s.*, p.p_name FROM sales s JOIN products p ON s.product_id = p.product_id AND s.user_id = p.user_id WHERE s.user_id = ?",
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching sales data:", err);
    res.status(500).json({ error: "Database query failed", details: err.message });
  }
};

// Record a new sale (scoped to the logged-in user)
export const recordSale = async (req, res) => {
  const user_id = req.user.user_id;
  const { product_id, quantity, total_price, customer_name, payment_method } = req.body;

  if (!product_id || !quantity || !total_price || !customer_name || !payment_method) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Make sure the product belongs to this user before selling it.
    const [owned] = await db.query(
      "SELECT product_id FROM products WHERE product_id = ? AND user_id = ?",
      [product_id, user_id]
    );
    if (owned.length === 0) {
      return res.status(404).json({ error: "Product not found for this user" });
    }

    // Insert into sales table
    await db.query(
      "INSERT INTO sales (user_id, product_id, quantity, total_price, customer_name, sales_date, payment_method) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
      [user_id, product_id, quantity, total_price, customer_name, payment_method]
    );

    // Decrement this user's stock for the sold product.
    await db.query(
      "UPDATE inventory SET quantity = quantity - ?, updated_at = NOW() WHERE product_id = ? AND user_id = ?",
      [quantity, product_id, user_id]
    );

    res.json({ message: "Sale recorded and inventory updated", product_id });
  } catch (err) {
    console.error("Error processing sale:", err);
    res.status(500).json({ error: "Database query failed", details: err.message });
  }
};

// Get sales report (scoped to the logged-in user)
export const getSalesReport = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = `
      SELECT DATE(sales_date) as sales_date, SUM(total_price) as total_sales
      FROM sales
      WHERE user_id = ?
      GROUP BY DATE(sales_date)
      ORDER BY sales_date;
    `;
    const [rows] = await db.query(query, [user_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).json({ error: "Error fetching sales report", details: error.message });
  }
};

// Get total sales (scoped to the logged-in user)
export const getTotalSales = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = `
      SELECT SUM(total_price) AS total_sales
      FROM sales
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [user_id]);
    res.json({ total_sales: rows[0].total_sales });
  } catch (error) {
    console.error("Error fetching total sales:", error);
    res.status(500).json({ error: "Error fetching total sales", details: error.message });
  }
};
