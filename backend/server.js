import express from "express";
import cors from "cors";
import cron from "node-cron";
import authRoutes from "./routes/auth.js";
import inventoryRoutes from "./routes/inventory.js";
import productsRoutes from "./routes/products.js";
import salesRoutes from "./routes/sales.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import suppliersRoutes from "./routes/suppliers.js";
import supplyRoutes from "./routes/supply.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import runLowStockPurchaseOrderJob from "./jobs/lowStockPurchaseOrderJob.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);
app.use("/api", inventoryRoutes);
app.use("/api", productsRoutes);
app.use("/api", salesRoutes);
app.use("/api", suppliersRoutes);
app.use("/api", supplyRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", purchaseOrderRoutes);
app.use("/api", profileRoutes);

app.use(errorHandler);

cron.schedule("*/1 * * * *", runLowStockPurchaseOrderJob);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
