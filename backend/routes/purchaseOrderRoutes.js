import express from "express";
import {
  getPurchaseOrders,
  getPurchaseOrderPreview,
  getPurchaseOrderPdf,
  approvePurchaseOrder,
  declinePurchaseOrder,
} from "../controllers/purchaseOrderController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/purchase-orders", getPurchaseOrders);
router.get("/purchase-orders/:poId/preview", getPurchaseOrderPreview);
router.get("/purchase-orders/:poId/pdf", getPurchaseOrderPdf);
router.post("/purchase-orders/:poId/approve", approvePurchaseOrder);
router.delete("/purchase-orders/:poId/decline", declinePurchaseOrder);

export default router;
