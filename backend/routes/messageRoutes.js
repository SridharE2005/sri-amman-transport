// routes/messageRoutes.js
import express from "express";
import { createMessage, getMessages, replyMessage, deleteMessage } from "../controllers/messageController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/",       createMessage);           // public — contact form
router.get("/",        protect, requireAdmin, getMessages);
router.put("/:id",     protect, requireAdmin, replyMessage);
router.delete("/:id",  protect, requireAdmin, deleteMessage);

export default router;
