import express from "express";
import {
  recordSupply,
  getSupplies,
  updateSupply,
  getSupplyAuditLog,
  deleteSupply,
} from "../controllers/supplyController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.post("/record-supply", recordSupply);
router.get("/supplies", getSupplies);
router.put("/supplies/:id", updateSupply);
router.get("/supplies/:id/audit", getSupplyAuditLog);
router.delete("/supplies/:id", deleteSupply);

export default router;
