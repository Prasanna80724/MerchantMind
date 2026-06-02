import express from "express";
import { getMonthlyStats } from "../controllers/dashboardController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/monthly-stats", getMonthlyStats);

export default router;
