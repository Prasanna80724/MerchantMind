import express from "express";
import {
  getSuppliers,
  addSupplier,
  deleteSupplier,
  updateSupplierStatus,
  getSupplierAnalytics,
  getTotalPurchaseCost,
  getSupp,
} from "../controllers/supplierController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/suppliers", getSuppliers);
router.get("/getsupp", getSupp);
router.post("/add-suppliers", addSupplier);
router.patch("/suppliers/:id/status", updateSupplierStatus);
router.delete("/delete-supplier/:id", deleteSupplier);
router.get("/supplier-analytics", getSupplierAnalytics);
router.get("/total-purchase-cost", getTotalPurchaseCost);

export default router;
