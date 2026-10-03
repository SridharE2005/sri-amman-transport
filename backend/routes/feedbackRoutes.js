import express from "express";
import { createFeedback, getMyFeedback, getAllFeedback } from "../controllers/feedbackController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createFeedback);
router.get("/my", protect, getMyFeedback);
router.get("/", protect, requireAdmin, getAllFeedback);

export default router;
