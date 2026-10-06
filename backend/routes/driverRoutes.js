// routes/driverRoutes.js
import express from "express";
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverById,
  getDriverProfile,
  checkInDriver,
  checkOutDriver,
  updateDriverLocation,
} from "../controllers/driverController.js";
import { protect, requireAdmin, requireDriver } from "../middleware/authMiddleware.js";

const router = express.Router();

// Driver specific routes
router.get("/me", protect, requireDriver, getDriverProfile);
router.post("/checkin", protect, requireDriver, checkInDriver);
router.patch("/checkin", protect, requireDriver, checkInDriver);
router.post("/checkout", protect, requireDriver, checkOutDriver);
router.patch("/checkout", protect, requireDriver, checkOutDriver);
router.post("/location", protect, requireDriver, updateDriverLocation);

// Admin & General routes
router.get("/",       getDrivers);
router.get("/:id",    protect, requireAdmin, getDriverById);
router.post("/",      protect, requireAdmin, createDriver);
router.put("/:id",    protect, requireAdmin, updateDriver);
router.delete("/:id", protect, requireAdmin, deleteDriver);

export default router;
