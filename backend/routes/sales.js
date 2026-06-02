import express from "express"; 
import { 
  getSales, 
  recordSale, 
  getSalesReport, 
  getTotalSales 
} from "../controllers/salesController.js"; 
import verifyToken from "../middleware/authMiddleware.js";
 
const router = express.Router(); 
router.use(verifyToken);
 
router.get("/sales", getSales); 
router.post("/sale", recordSale); 
router.get("/sales-report", getSalesReport); 
router.get("/total-sales", getTotalSales); 
 
export default router; 
