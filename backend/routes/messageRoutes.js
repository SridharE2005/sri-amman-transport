// routes/messageRoutes.js
import express from "express";
import { createMessage, getMessages, replyMessage, deleteMessage, markAllMessagesRead } from "../controllers/messageController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",               createMessage);           // public — contact form
router.get("/",                protect, requireAdmin, getMessages);
router.put("/mark-all-read",   protect, requireAdmin, markAllMessagesRead);
router.put("/:id",             protect, requireAdmin, replyMessage);
router.delete("/:id",          protect, requireAdmin, deleteMessage);

export default router;
