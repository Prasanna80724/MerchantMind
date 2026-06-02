// Backend - Controllers (controllers/invoiceController.js)

import db from "../config/db.js";


export const getPendingInvoices = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const [rows] = await db.query(`
      SELECT 
        invoices.*, 
        products.p_name,
        TO_BASE64(invoices.invoice_file_path) AS invoice_file_path
      FROM invoices 
      JOIN products ON invoices.product_id = products.product_id AND invoices.user_id = products.user_id
      WHERE invoices.user_id = ?;
    `, [user_id]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching pending invoices:', error);
    res.status(500).json({ error: 'Failed to fetch pending invoices' });
  }
};


export const approveInvoice = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const { invoiceId } = req.params;
    const [result] = await db.query(
      'UPDATE invoices SET status = ?, updated_at = NOW() WHERE invoice_id = ? AND user_id = ?',
      ['Approved', invoiceId, user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice approved successfully' });
  } catch (error) {
    console.error('Error approving invoice:', error);
    res.status(500).json({ error: 'Failed to approve invoice' });
  }
};

export const declineInvoice = async (req, res) => {
  const user_id = req.user.user_id;
  try {
    const { invoiceId } = req.params;
    const [result] = await db.query(
      'DELETE FROM invoices WHERE invoice_id = ? AND user_id = ?',
      [invoiceId, user_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ message: 'Invoice declined successfully' });
  } catch (error) {
    console.error('Error declining invoice:', error);
    res.status(500).json({ error: 'Failed to decline invoice' });
  }
};
