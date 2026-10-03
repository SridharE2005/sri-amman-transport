// routes/goodsRoutes.js
import express from "express";
import { getGoods, createGoods, updateGoods, deleteGoods } from "../controllers/goodsController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",       protect, getGoods);
router.post("/",      protect, requireAdmin, createGoods);
router.put("/:id",    protect, requireAdmin, updateGoods);
router.delete("/:id", protect, requireAdmin, deleteGoods);

export default router;
