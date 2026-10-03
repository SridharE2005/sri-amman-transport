// routes/bookingRoutes.js
import express from "express";
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  confirmBooking,
  rejectBooking,
  revokeBooking,
  deliverBooking,
  deleteBooking,
  getBookingStats,
  trackBooking,
  cancelBooking,
  getCancellationStatus,
  requestCancellation,
  getCancellationRequests,
  reviewCancellationRequest,
} from "../controllers/bookingController.js";
import { protect, requireAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/track/:bookingId", trackBooking);
router.get("/track", trackBooking);
router.get("/my", protect, getMyBookings);
router.get("/stats", protect, requireAdmin, getBookingStats);

// Cancellation requests (Admin) - Must come before /:id
router.get("/cancellation-requests", protect, requireAdmin, getCancellationRequests);
router.put("/cancellation-requests/:requestId/review", protect, requireAdmin, reviewCancellationRequest);

// Booking Cancellation operations (User & Admin)
router.patch("/:id/cancel", protect, cancelBooking);
router.get("/:id/cancellation-status", protect, getCancellationStatus);
router.post("/:id/cancellation-request", protect, requestCancellation);

// General bookings collection
router.get("/", protect, requireAdmin, getAllBookings);

// Admin management actions
router.put("/:id/confirm", protect, requireAdmin, confirmBooking);
router.put("/:id/reject", protect, requireAdmin, rejectBooking);
router.put("/:id/revoke", protect, requireAdmin, revokeBooking);
router.put("/:id/deliver", protect, requireAdmin, deliverBooking);
router.delete("/:id", protect, requireAdmin, deleteBooking);

export default router;
