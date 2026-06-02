import express from "express";
import { getProfile, updateCompanyProfile } from "../controllers/profileController.js";
import verifyToken from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/profile", getProfile);
router.patch("/profile/company", updateCompanyProfile);

export default router;
