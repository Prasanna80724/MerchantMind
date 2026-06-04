import express from "express";
import { chatWithAssistant, getSuggestedQuestions } from "../controllers/aiController.js";
import verifyToken from "../middleware/authMiddleware.js";
import aiRateLimiter from "../middleware/aiRateLimiter.js";

const router = express.Router();
router.use(verifyToken);

router.get("/ai/suggestions", getSuggestedQuestions);
router.post("/ai/chat", aiRateLimiter, chatWithAssistant);

export default router;
