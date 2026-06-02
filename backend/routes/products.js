import express from "express";
import {
  addProducts,
  getProductSales,
  getTopSellingProducts,
  addinventory,
  getProductsCatalog,
} from "../controllers/productController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.post("/add-products", addProducts);
router.post("/add-inventory", addinventory);
router.get("/products", getProductsCatalog);
router.get("/product-sales", getProductSales);
router.get("/top-selling-products", getTopSellingProducts);

export default router;
