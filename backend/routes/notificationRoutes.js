import express from "express";
import { getMyNotifications, markNotificationsAsRead } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my", protect, getMyNotifications);
router.put("/mark-read", protect, markNotificationsAsRead);

export default router;