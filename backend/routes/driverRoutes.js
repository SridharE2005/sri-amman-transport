// routes/driverRoutes.js
import express from "express";
import { getDrivers, createDriver, updateDriver, deleteDriver } from "../controllers/driverController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/",       getDrivers);
router.post("/",      protect, requireAdmin, createDriver);
router.put("/:id",    protect, requireAdmin, updateDriver);
router.delete("/:id", protect, requireAdmin, deleteDriver);

export default router;
