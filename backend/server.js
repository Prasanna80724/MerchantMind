import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventory.js";
import productsRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import suppliersRoutes from "./routes/suppliers.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import cron from 'node-cron';
import db from './config/db.js';
import { jsPDF } from 'jspdf';

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", productsRoutes);
app.use("/api", salesRoutes);
app.use("/api", suppliersRoutes);
app.use("/api", dashboardRoutes); 
app.use("/api", invoiceRoutes);

// Error handling middleware
app.use(errorHandler);

cron.schedule('*/1 * * * *', async () => {
  console.log('Cron job is running every minute.');
  try {
    const [rows] = await db.query(`
      SELECT p.user_id, p.product_id, p.p_name, p.supplier_id, p.price, s.name, s.email, s.phone_no, i.quantity, p.threshold
      FROM products p
      JOIN inventory i ON p.product_id = i.product_id AND p.user_id = i.user_id
      JOIN suppliers s ON p.supplier_id = s.supplier_id AND p.user_id = s.user_id
      WHERE i.quantity < p.threshold
    `);

    if (rows.length > 0) {
      for (const product of rows) {

        const [existingInvoice] = await db.query(
          `SELECT * FROM invoices WHERE product_id = ? AND user_id = ? AND status IN ('Pending', 'Approved', 'Declined')`,
          [product.product_id, product.user_id]
        );

        if (existingInvoice.length > 0) {
          console.log(`Invoice already exists for Product ID: ${product.product_id}. Skipping invoice creation.`);
          continue;
        }

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Your Company Name', 14, 20);
        doc.setFontSize(12);
        doc.text('Phone: 000-000-0000', 14, 40);
        doc.text('Email: yourcompany@email.com', 14, 45);

        // Invoice Title
        doc.setFontSize(16);
        doc.text('INVOICE', 150, 20);

        // Invoice Info
        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 30);
        doc.text(`Invoice #: ${Math.floor(1000 + Math.random() * 9000)}`, 150, 35);

        // Supplier Information
        doc.setFontSize(12);
        doc.setDrawColor(0, 0, 0);
        doc.setFillColor(200, 200, 200);
        doc.rect(14, 50, 180, 10, 'F');
        doc.setTextColor(0, 0, 0);
        doc.text('BILL TO', 16, 57);

        doc.text(`Supplier Name: ${product.name}`, 14, 65);
        doc.text(`Supplier Email: ${product.email}`, 14, 75);
        doc.text(`Supplier Phone: ${product.phone_no}`, 14, 80);

        // Invoice Table
        doc.setFontSize(12);
        doc.text('DESCRIPTION', 14, 90);
        doc.text('PRICE', 140, 90);
        doc.text('QUANTITY', 170, 90);

        // Product Details
        doc.setFontSize(12);
        doc.text(product.p_name, 14, 100);
        doc.text(`₹${product.price}`, 140, 100);
        doc.text('10', 170, 100);

        // Total
        const totalPrice = product.price * 10;
        doc.text(`Total: ₹${totalPrice.toFixed(2)}`, 150, 120);

        const pdfData = Buffer.from(doc.output('arraybuffer'));

        const [result] = await db.query(
          'INSERT INTO invoices (user_id, product_id, supplier_id, invoice_file_path, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [product.user_id, product.product_id, product.supplier_id, pdfData, 'Pending']
        );

        if (result.affectedRows > 0) {
          console.log(`Invoice successfully stored for Product ID: ${product.product_id}`);
        } else {
          console.log(`Failed to store invoice for Product ID: ${product.product_id}`);
        }
      }
      console.log('Invoice generation task completed successfully.');
    } else {
      console.log('No products below threshold, skipping invoice generation.');
    }
  } catch (error) {
    console.error('Error generating invoices:', error.message);
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
