import express from "express";
import { getAdminHistory, deleteAdminHistory } from "../controllers/adminHistoryController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, requireAdmin, getAdminHistory);
router.delete("/:id", protect, requireAdmin, deleteAdminHistory);

export default router;