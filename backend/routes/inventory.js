import express from "express"; 
import { getInventory, deleteProduct, getTotalStock } from "../controllers/inventoryController.js"; 
import verifyToken from "../middleware/authMiddleware.js";
 
const router = express.Router(); 
router.use(verifyToken);
 
router.get("/inventory", getInventory); 
router.get("/total-stock", getTotalStock); 
router.delete("/delete-product/:id", deleteProduct); 
 
export default router; 
