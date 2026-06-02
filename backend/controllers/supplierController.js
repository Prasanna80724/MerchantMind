import db from "../config/db.js";

// Get all suppliers with their supplied products (scoped to the logged-in user)
export const getSuppliers = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = `
      SELECT s.*, p.*, ps.*
      FROM product_supplied ps
      INNER JOIN suppliers s ON s.supplier_id = ps.supplier_id AND s.user_id = ps.user_id
      INNER JOIN products p ON ps.product_id = p.product_id AND ps.user_id = p.user_id
      WHERE ps.user_id = ?;
    `;
    const [results] = await db.query(query, [user_id]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    res.status(500).json({ error: "Database query failed", details: err.message });
  }
};

export const getSupp = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = `SELECT * FROM suppliers WHERE user_id = ?;`;
    const [results] = await db.query(query, [user_id]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    res.status(500).json({ error: "Database query failed", details: err.message });
  }
};

// Add a new supplier (scoped to the logged-in user)
export const addSupplier = async (req, res) => {
  const user_id = req.user.user_id;
  const { name, email, phone, product_name, quantity, purchase_cost } = req.body;

  try {
    // Start a transaction
    await db.beginTransaction();

    // Insert into suppliers table
    const [supplierResult] = await db.query(
      "INSERT INTO suppliers (user_id, name, email, phone_no) VALUES (?, ?, ?, ?)",
      [user_id, name, email, phone]
    );
    const supplier_id = supplierResult.insertId;

    // Lookup product in products table (only this user's products)
    const [productResult] = await db.query(
      "SELECT product_id FROM products WHERE p_name = ? AND user_id = ?",
      [product_name, user_id]
    );

    if (productResult.length === 0) {
      await db.rollback();
      console.error("Product not found");
      return res.status(500).json({ error: "Product not found" });
    }

    const product_id = productResult[0].product_id;

    // Insert into product_supplied table
    await db.query(
      "INSERT INTO product_supplied (user_id, product_id, supplier_id, quantity, supplied_date, purchase_cost) VALUES (?, ?, ?, ?, NOW(), ?)",
      [user_id, product_id, supplier_id, quantity, purchase_cost]
    );

    // Commit transaction
    await db.commit();

    res.status(200).json({
      message: "Supplier and product supplied added successfully",
      supplier_id,
      product_id,
    });
  } catch (err) {
    await db.rollback();
    console.error("Error adding supplier:", err);
    res.status(500).json({ error: "Database query failed", details: err.message });
  }
};

// Delete a supplier's supply mappings (scoped to the logged-in user)
export const deleteSupplier = async (req, res) => {
  const user_id = req.user.user_id;
  const supplierId = req.params.id;

  try {
    const [result] = await db.query(
      "DELETE FROM product_supplied WHERE supplier_id = ? AND user_id = ?",
      [supplierId, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Supplier not found in product_supplied table" });
    }

    res.status(200).json({ message: "Supplier deleted from product_supplied successfully" });
  } catch (err) {
    console.error("Error deleting supplier:", err);
    res.status(500).json({ error: "Error deleting supplier", details: err.message });
  }
};

// Get supplier analytics (scoped to the logged-in user)
export const getSupplierAnalytics = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = `
      SELECT s.name, COUNT(ps.product_id) AS products_supplied
      FROM suppliers s
      LEFT JOIN product_supplied ps ON s.supplier_id = ps.supplier_id AND s.user_id = ps.user_id
      WHERE s.user_id = ?
      GROUP BY s.supplier_id, s.name
      ORDER BY products_supplied DESC
    `;
    const [rows] = await db.query(query, [user_id]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching supplier analytics:", error);
    res.status(500).json({
      error: "Error fetching supplier analytics",
      details: error.message,
    });
  }
};

// Get total purchase cost (scoped to the logged-in user)
export const getTotalPurchaseCost = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const query = `
      SELECT SUM(quantity * purchase_cost) AS total_purchase_cost
      FROM product_supplied
      WHERE user_id = ?
    `;
    const [rows] = await db.query(query, [user_id]);
    res.json({ total_purchase_cost: rows[0].total_purchase_cost });
  } catch (error) {
    console.error("Error fetching total purchase cost:", error);
    res.status(500).json({
      error: "Error fetching total purchase cost",
      details: error.message,
    });
  }
};
