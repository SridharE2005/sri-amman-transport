// controllers/bookingController.js
import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Goods   from "../models/Goods.js";
import Notifications from "../models/Notifications.js";
import UsersHistory from "../models/UsersHistory.js";
import AdminHistory from "../models/AdminHistory.js";
import CancellationRequest from "../models/CancellationRequest.js";
import { generateUniqueBookingId } from "../utils/generateBookingId.js";
import { dispatchRealTimeEvent } from "../utils/notificationDispatcher.js";

const snapshotGoods = (goods) => ({
  _id: goods._id,
  material: goods.material,
  title: goods.title,
  location: goods.location,
  unitPrice: getUnitPrice(goods),
});

const snapshotDriver = (driver) => driver ? ({
  name: driver.name,
  phone: driver.phone,
  vehicle: driver.vehicle,
}) : null;

const getAvailable = (g) => {
  if (g.material === "Bricks") return Number(g.howManyBricks) || 0;
  if (g.material === "M-Sand" || g.material === "River Sand") return Number(g.units) || 0;
  if (g.material === "Dry Grass Rolls") return Number(g.noOfRolls) || 0;
  return Number(g.availableLorries) || 0;
};

const setAvailable = (g, nextQty) => {
  const safeQty = Math.max(0, Number(nextQty) || 0);
  if (g.material === "Bricks") g.howManyBricks = safeQty;
  else if (g.material === "M-Sand" || g.material === "River Sand") g.units = safeQty;
  else if (g.material === "Dry Grass Rolls") g.noOfRolls = safeQty;
  else g.availableLorries = safeQty;

  if (safeQty === 0) g.status = "Full";
  else if (safeQty <= 2) g.status = "Limited";
  else g.status = "Available";
};

const getUnitPrice = (g) => {
  if (g.material === "Bricks") return Number(g.pricePerBrick) || 0;
  if (g.material === "M-Sand" || g.material === "River Sand") return Number(g.pricePerUnit) || 0;
  if (g.material === "Dry Grass Rolls") return Number(g.pricePerRoll) || 0;
  return 0;
};

const historyData = (booking, status, reason = "") => ({
  user: booking.user,
  booking: booking._id,
  bookingId: booking.bookingId || "",
  status,
  material: booking.goodsData.material,
  title: booking.goodsData.title,
  orderQty: booking.orderQty,
  estimatedAmount: booking.estimatedAmount,
  reason: reason || booking.cancellationReason || booking.rejectionReason || booking.revokedReason || "",
  cancelledAt: booking.cancelledAt || null,
  cancelledBy: booking.cancelledBy || null,
  cancellationReason: booking.cancellationReason || null,
  driverData: status === "Confirmed" ? booking.driverData : undefined,
});

const saveApprovedHistory = (booking, status, reason = "") => UsersHistory.findOneAndUpdate(
  { booking: booking._id },
  historyData(booking, status, reason),
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

const saveRejectedNotification = (booking) => Notifications.findOneAndUpdate(
  { booking: booking._id },
  historyData(booking, "Rejected", booking.rejectionReason),
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

const adminHistoryData = (booking, status = booking.status, reason = "") => ({
  booking: booking._id,
  bookingId: booking.bookingId || "",
  user: booking.user,
  customerName: booking.customerName,
  customerEmail: booking.customerEmail,
  customerPhone: booking.customerPhone,
  material: booking.goodsData.material,
  title: booking.goodsData.title,
  orderQty: booking.orderQty,
  estimatedAmount: booking.estimatedAmount,
  status,
  reason: reason || booking.cancellationReason || booking.rejectionReason || booking.revokedReason || "",
  cancelledAt: booking.cancelledAt || null,
  cancelledBy: booking.cancelledBy || null,
  cancellationReason: booking.cancellationReason || null,
  driverData: booking.driverData,
});

const saveAdminHistory = (booking, status = booking.status, reason = "") => AdminHistory.findOneAndUpdate(
  { booking: booking._id },
  adminHistoryData(booking, status, reason),
  { upsert: true, new: true, setDefaultsOnInsert: true }
);

// User: create a booking
export const createBooking = async (req, res) => {
  if (req.user?.role === "admin") {
    return res.status(403).json({ message: "Admins cannot book materials. View and inspect only." });
  }
  const { goodsId, customerName, customerEmail, customerPhone, orderQty, deliveryAddress } = req.body;
  if (!customerName || !customerEmail || !customerPhone || !orderQty || !deliveryAddress)
    return res.status(400).json({ message: "Please fill all booking details" });
  if (!/^.+,\s*.+\s-\s\d{6}$/.test(String(deliveryAddress).trim()))
    return res.status(400).json({ message: "Delivery address must include village or city, district, and 6-digit pincode" });
  if (!/^\d{10}$/.test(String(customerPhone)))
    return res.status(400).json({ message: "Phone number must contain exactly 10 digits" });
  if (!/^\d+$/.test(String(orderQty)))
    return res.status(400).json({ message: "Order quantity must contain numbers only" });

  const qty = Number(orderQty);
  if (!Number.isSafeInteger(qty) || qty <= 0)
    return res.status(400).json({ message: "Order quantity must be greater than zero" });

  const goods = await Goods.findById(goodsId).populate("assignedDriver");
  if (!goods) return res.status(404).json({ message: "Goods not found" });

  const available = getAvailable(goods);
  if (goods.status === "Full" || available < 1)
    return res.status(400).json({ message: "No availability" });
  if (qty > available)
    return res.status(400).json({ message: `Only ${available} ${goods.material === "Bricks" ? "bricks" : goods.material === "Dry Grass Rolls" ? "rolls" : "units"} available` });

  let booking;
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const bookingId = await generateUniqueBookingId();
      const bookingCreatedAt = new Date();
      const cancellationDeadline = new Date(bookingCreatedAt.getTime() + 24 * 60 * 60 * 1000);
      booking = await Booking.create({
        bookingId,
        user: req.user._id,
        goodsData: snapshotGoods(goods),
        driverData: snapshotDriver(goods.assignedDriver),
        customerName, customerEmail, customerPhone,
        orderQty: qty,
        estimatedAmount: qty * getUnitPrice(goods),
        deliveryAddress,
        cancellationDeadline,
      });
      break;
    } catch (err) {
      if (err.code === 11000 && (err.keyPattern?.bookingId || err.message?.includes("bookingId"))) {
        if (attempt === maxAttempts - 1) {
          return res.status(500).json({ message: "Failed to generate a unique booking ID. Please try again." });
        }
        continue;
      }
      throw err;
    }
  }

  await saveAdminHistory(booking, "Pending");
  res.status(201).json(booking);
};

// User: get own bookings with optional pagination
export const getMyBookings = async (req, res) => {
  try {
    const filter = { user: req.user._id };

    if (req.query.status && req.query.status !== "All") {
      if (req.query.status === "Cancelled") {
        filter.status = {
          $in: [
            "CANCELLED_BY_USER",
            "CANCELLED_BY_ADMIN",
            "Cancelled by User",
            "Cancelled by Admin",
          ],
        };
      } else {
        filter.status = req.query.status;
      }
    }

    if (req.query.search) {
      const s = req.query.search.trim();
      filter.$or = [
        { bookingId: { $regex: s, $options: "i" } },
        { "goodsData.title": { $regex: s, $options: "i" } },
        { "goodsData.material": { $regex: s, $options: "i" } },
        { deliveryAddress: { $regex: s, $options: "i" } },
      ];
    }

    if (req.query.page || req.query.limit || req.query.paginate === "true") {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
      const total = await Booking.countDocuments(filter);
      const totalPages = Math.ceil(total / limit) || 1;

      const bookings = await Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return res.json({
        data: bookings,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
    }

    const bookings = await Booking.find(filter).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to fetch bookings" });
  }
};

// Admin: get all bookings with user info
export const getAllBookings = async (req, res) => {
  const query = Booking.find()
    .populate("user", "firstName lastName email")
    .sort({ createdAt: -1 });
  if (req.query.limit) query.limit(Math.min(Number(req.query.limit) || 6, 50));
  const bookings = await query;
  res.json(bookings);
};

// Admin: confirm booking
export const confirmBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(booking.status)) {
    return res.status(400).json({ message: "Cannot approve: this booking has already been cancelled by the customer." });
  }

  if (booking.status !== "Pending" && booking.status !== "PENDING")
    return res.status(400).json({ message: "Only pending bookings can be confirmed" });

  const goods = await Goods.findById(booking.goodsData._id).populate("assignedDriver");
  if (!goods) return res.status(404).json({ message: "Goods not found" });

  const available = getAvailable(goods);
  const requestedQty = Number(booking.orderQty) || 0;
  if (requestedQty <= 0)
    return res.status(400).json({ message: "Booking quantity is invalid" });
  if (requestedQty > available)
    return res.status(400).json({ message: "Not enough stock available to confirm this booking" });

  const approvedAt = new Date();
  // Preserve 24-hour deadline from the time user booked the goods (do not extend upon admin approval)
  const cancellationDeadline = booking.cancellationDeadline || new Date(
    (booking.createdAt ? new Date(booking.createdAt).getTime() : approvedAt.getTime()) + 24 * 60 * 60 * 1000
  );

  // Concurrency guard: update atomically only if status is still Pending
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: ["Pending", "PENDING"] } },
    {
      $set: {
        status: "Confirmed",
        approvedAt,
        cancellationDeadline,
        driverData: snapshotDriver(goods.assignedDriver),
        rejectionReason: "",
        revokedReason: "",
        revokedAt: null,
      },
    },
    { new: true }
  );

  if (!updatedBooking) {
    return res.status(409).json({ message: "Booking was already modified or cancelled by the customer." });
  }

  setAvailable(goods, available - requestedQty);
  await goods.save();

  await saveApprovedHistory(updatedBooking, "Confirmed");
  await saveAdminHistory(updatedBooking, "Confirmed");

  dispatchRealTimeEvent(req.app, "booking_confirmed", {
    bookingId: updatedBooking.bookingId,
    approvedAt: updatedBooking.approvedAt,
    cancellationDeadline: updatedBooking.cancellationDeadline,
  });

  await updatedBooking.populate("user", "firstName lastName email");
  res.json(updatedBooking);
};

// Admin: reject booking
export const rejectBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  if (["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(booking.status)) {
    return res.status(400).json({ message: "Cannot reject: this booking has already been cancelled by the customer." });
  }

  if (booking.status !== "Pending" && booking.status !== "PENDING")
    return res.status(400).json({ message: "Only pending bookings can be rejected" });

  const reason = req.body.reason?.trim();
  if (!reason) return res.status(400).json({ message: "A rejection reason is required" });

  // Concurrency guard
  const updatedBooking = await Booking.findOneAndUpdate(
    { _id: booking._id, status: { $in: ["Pending", "PENDING"] } },
    {
      $set: {
        status: "Rejected",
        rejectionReason: reason,
      },
    },
    { new: true }
  );

  if (!updatedBooking) {
    return res.status(409).json({ message: "Booking was already modified or cancelled." });
  }

  await saveRejectedNotification(updatedBooking);
  await saveAdminHistory(updatedBooking, "Rejected", reason);

  dispatchRealTimeEvent(req.app, "booking_rejected", {
    bookingId: updatedBooking.bookingId,
    reason,
  });

  await updatedBooking.populate("user", "firstName lastName email");
  res.json(updatedBooking);
};

// Admin: revoke a confirmed booking and restore availability
export const revokeBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.status !== "Confirmed" && booking.status !== "CONFIRMED")
    return res.status(400).json({ message: "Only confirmed bookings can be revoked" });

  const reason = req.body.reason?.trim();
  if (!reason) return res.status(400).json({ message: "A revocation reason is required" });

  const goods = await Goods.findById(booking.goodsData._id);
  if (goods) {
    const currentQty = getAvailable(goods);
    setAvailable(goods, currentQty + (Number(booking.orderQty) || 0));
    await goods.save();
  }

  booking.status = "Revoked";
  booking.revokedReason = reason;
  booking.revokedAt = new Date();
  await booking.save();
  await saveApprovedHistory(booking, "Revoked", reason);
  await saveAdminHistory(booking, "Revoked", reason);

  await booking.populate("user", "firstName lastName email");
  res.json(booking);
};

// Admin: mark a confirmed booking as delivered
export const deliverBooking = async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  if (booking.status !== "Confirmed" && booking.status !== "CONFIRMED")
    return res.status(400).json({ message: "Only confirmed bookings can be delivered" });

  booking.status = "Delivered";
  await booking.save();
  await saveApprovedHistory(booking, "Delivered");
  await saveAdminHistory(booking, "Delivered");
  await booking.populate("user", "firstName lastName email");
  res.json(booking);
};

// Admin: permanently delete a historical booking
export const deleteBooking = async (req, res) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });
  await Promise.all([
    UsersHistory.deleteOne({ booking: booking._id }),
    Notifications.deleteOne({ booking: booking._id }),
    AdminHistory.deleteOne({ booking: booking._id }),
    CancellationRequest.deleteMany({ booking: booking._id }),
  ]);
  res.json({ message: "Booking deleted" });
};

// Admin: dashboard counts
export const getBookingStats = async (req, res) => {
  const [total, pending, confirmed, rejected, cancelledByUser, cancelledByAdmin, pendingCancellationRequests] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ status: { $in: ["Pending", "PENDING"] } }),
    Booking.countDocuments({ status: { $in: ["Confirmed", "CONFIRMED"] } }),
    Booking.countDocuments({ status: { $in: ["Rejected", "REJECTED"] } }),
    Booking.countDocuments({ status: { $in: ["CANCELLED_BY_USER", "Cancelled by User"] } }),
    Booking.countDocuments({ status: { $in: ["CANCELLED_BY_ADMIN", "Cancelled by Admin"] } }),
    CancellationRequest.countDocuments({ status: "PENDING" }),
  ]);

  const payload = {
    total,
    pending,
    confirmed,
    rejected,
    cancelled: cancelledByUser + cancelledByAdmin,
    cancelledByUser,
    cancelledByAdmin,
    pendingCancellationRequests,
  };
  res.json(payload);
};

// Customer: track booking by bookingId
export const trackBooking = async (req, res) => {
  try {
    const bookingId = (req.params.bookingId || req.query.bookingId || "").trim().toUpperCase();
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to track booking" });
  }
};

// ==========================================
// BOOKING CANCELLATION SYSTEM CONTROLLERS
// ==========================================

// User / Admin: cancel a booking
export const cancelBooking = async (req, res) => {
  try {
    const idOrCode = (req.params.bookingId || req.params.id || "").trim();
    if (!idOrCode) {
      return res.status(400).json({ message: "Booking identifier is required" });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(idOrCode);
    const booking = await Booking.findOne(
      isMongoId ? { _id: idOrCode } : { bookingId: idOrCode.toUpperCase() }
    );

    // 1. Validate booking exists
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Validate user owns booking or is admin
    const isOwner = String(booking.user) === String(req.user._id);
    const isAdmin = req.user?.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "You are not authorized to cancel this booking" });
    }

    // 3. Validate cancellation reason is provided
    const reason = (req.body.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "Please provide a valid cancellation reason" });
    }

    // 4. Validate current status allows cancellation
    const currentStatus = booking.status;
    if (["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(currentStatus)) {
      return res.status(400).json({ message: "This booking has already been cancelled" });
    }

    if (["Delivered", "COMPLETED", "Rejected", "Revoked"].includes(currentStatus)) {
      return res.status(400).json({ message: `Cannot cancel a booking with status "${currentStatus}"` });
    }

    const now = new Date();
    const isPending = ["Pending", "PENDING"].includes(currentStatus);
    const isConfirmed = ["Confirmed", "CONFIRMED"].includes(currentStatus);

    if (!isPending && !isConfirmed) {
      return res.status(400).json({ message: `Cancellation is not permitted for booking status "${currentStatus}"` });
    }

    // 24-hour cancellation limit from the time the user booked the order (regardless of admin approval)
    const bookingTime = booking.createdAt ? new Date(booking.createdAt).getTime() : now.getTime();
    const deadline = booking.cancellationDeadline || new Date(bookingTime + 24 * 60 * 60 * 1000);

    // Backend security check: 24-hour expiration from booking time
    if (now >= deadline && !isAdmin) {
      return res.status(400).json({
        message: "Your 24-hour cancellation period from booking time has expired. You may submit an exceptional cancellation request.",
        expired: true,
        cancellationDeadline: deadline,
      });
    }

    // Atomic update with race-condition guard
    const query = {
      _id: booking._id,
      status: { $in: isPending ? ["Pending", "PENDING"] : ["Confirmed", "CONFIRMED"] },
    };
    if (!isAdmin) {
      query.$or = [
        { cancellationDeadline: { $gt: now } },
        { cancellationDeadline: null, createdAt: { $gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
      ];
    }

    let updatedBooking = await Booking.findOneAndUpdate(
      query,
      {
        $set: {
          status: "CANCELLED_BY_USER",
          cancelledAt: now,
          cancelledBy: isAdmin ? "ADMIN" : "USER",
          cancellationReason: reason,
        },
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(409).json({
        message: "Cancellation window has just closed or booking state was updated simultaneously.",
      });
    }

    // Restore stock back into Goods inventory if it was already confirmed
    if (isConfirmed) {
      const goods = await Goods.findById(updatedBooking.goodsData._id);
      if (goods) {
        const currentQty = getAvailable(goods);
        setAvailable(goods, currentQty + (Number(updatedBooking.orderQty) || 0));
        await goods.save();
      }
    }

    // Save audit records in history and notifications (booking is NOT deleted)
    await Promise.all([
      saveApprovedHistory(updatedBooking, "CANCELLED_BY_USER", reason),
      saveAdminHistory(updatedBooking, "CANCELLED_BY_USER", reason),
      Notifications.findOneAndUpdate(
        { booking: updatedBooking._id },
        {
          user: updatedBooking.user,
          booking: updatedBooking._id,
          bookingId: updatedBooking.bookingId || "",
          status: "CANCELLED_BY_USER",
          material: updatedBooking.goodsData?.material || "",
          title: updatedBooking.goodsData?.title || "",
          orderQty: updatedBooking.orderQty || 0,
          estimatedAmount: updatedBooking.estimatedAmount || 0,
          reason,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ),
    ]);

    // Dispatch real-time notification
    dispatchRealTimeEvent(req.app, "booking_cancelled", {
      bookingId: updatedBooking.bookingId,
      booking: updatedBooking._id,
      customerName: updatedBooking.customerName,
      status: "CANCELLED_BY_USER",
      cancelledAt: updatedBooking.cancelledAt,
      cancelledBy: updatedBooking.cancelledBy,
      reason,
    });

    await updatedBooking.populate("user", "firstName lastName email");
    res.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: error.message || "Failed to cancel booking" });
  }
};

// User / Admin: get cancellation availability and window details
export const getCancellationStatus = async (req, res) => {
  try {
    const idOrCode = (req.params.bookingId || req.params.id || "").trim();
    if (!idOrCode) {
      return res.status(400).json({ message: "Booking identifier is required" });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(idOrCode);
    const booking = await Booking.findOne(
      isMongoId ? { _id: idOrCode } : { bookingId: idOrCode.toUpperCase() }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const currentStatus = booking.status;
    const isPending = ["Pending", "PENDING"].includes(currentStatus);
    const isConfirmed = ["Confirmed", "CONFIRMED"].includes(currentStatus);

    if (isPending || isConfirmed) {
      const bookingTime = booking.createdAt ? new Date(booking.createdAt).getTime() : Date.now();
      const deadline = booking.cancellationDeadline || new Date(bookingTime + 24 * 60 * 60 * 1000);
      const now = new Date();
      const remainingMilliseconds = deadline.getTime() - now.getTime();

      if (remainingMilliseconds > 0) {
        return res.json({
          canCancel: true,
          reasonRequired: true,
          status: isPending ? "Pending" : "Confirmed",
          cancellationDeadline: deadline,
          remainingMilliseconds,
          remainingHours: (remainingMilliseconds / (1000 * 60 * 60)).toFixed(1),
          message: "Cancellation available within 24 hours of booking",
        });
      }

      return res.json({
        canCancel: false,
        reason: "24-hour cancellation period from booking time has expired",
        status: isPending ? "Pending" : "Confirmed",
        cancellationDeadline: deadline,
        remainingMilliseconds: 0,
        canRequestExceptional: true,
      });
    }

    if (["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(currentStatus)) {
      return res.json({
        canCancel: false,
        reason: "Booking has already been cancelled",
        cancelledAt: booking.cancelledAt,
        cancelledBy: booking.cancelledBy,
        cancellationReason: booking.cancellationReason,
      });
    }

    return res.json({
      canCancel: false,
      reason: `Booking status "${currentStatus}" does not permit cancellation`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to get cancellation status" });
  }
};

// User: submit exceptional cancellation request after 24 hours
export const requestCancellation = async (req, res) => {
  try {
    const idOrCode = (req.params.bookingId || req.params.id || "").trim();
    if (!idOrCode) {
      return res.status(400).json({ message: "Booking identifier is required" });
    }

    const isMongoId = mongoose.Types.ObjectId.isValid(idOrCode);
    const booking = await Booking.findOne(
      isMongoId ? { _id: idOrCode } : { bookingId: idOrCode.toUpperCase() }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (String(booking.user) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "You are not authorized to request cancellation for this booking" });
    }

    if (["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN"].includes(booking.status)) {
      return res.status(400).json({ message: "Booking is already cancelled" });
    }

    const reason = (req.body.reason || "").trim();
    if (!reason) {
      return res.status(400).json({ message: "A reason is required for your cancellation request" });
    }

    // Check if pending request already exists
    const existing = await CancellationRequest.findOne({
      booking: booking._id,
      status: "PENDING",
    });
    if (existing) {
      return res.status(400).json({
        message: "You already have a cancellation request pending review for this booking",
        request: existing,
      });
    }

    const request = await CancellationRequest.create({
      booking: booking._id,
      bookingId: booking.bookingId || "",
      user: req.user._id,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail,
      reason,
      requestedAt: new Date(),
      status: "PENDING",
    });

    dispatchRealTimeEvent(req.app, "cancellation_requested", {
      requestId: request._id,
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      reason,
    });

    res.status(201).json({
      message: "Cancellation request submitted successfully. Sri Amman Transport support team will review your request.",
      request,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to submit cancellation request" });
  }
};

// Admin: list all cancellation requests
export const getCancellationRequests = async (req, res) => {
  try {
    const query = req.query.status ? { status: req.query.status } : {};
    const requests = await CancellationRequest.find(query)
      .populate("booking")
      .populate("user", "firstName lastName email phone")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to load cancellation requests" });
  }
};

// Admin: review cancellation request (Approve / Reject)
export const reviewCancellationRequest = async (req, res) => {
  try {
    const { action, adminNotes } = req.body; // action: "approve" | "reject"
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Action must be either 'approve' or 'reject'" });
    }

    const request = await CancellationRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Cancellation request not found" });
    }

    if (request.status !== "PENDING") {
      return res.status(400).json({ message: `Request is already ${request.status}` });
    }

    const booking = await Booking.findById(request.booking);
    if (!booking) {
      return res.status(404).json({ message: "Associated booking not found" });
    }

    if (action === "approve") {
      // If booking was Confirmed, restore goods availability
      if (["Confirmed", "CONFIRMED"].includes(booking.status)) {
        const goods = await Goods.findById(booking.goodsData._id);
        if (goods) {
          const currentQty = getAvailable(goods);
          setAvailable(goods, currentQty + (Number(booking.orderQty) || 0));
          await goods.save();
        }
      }

      const reasonText = request.reason + (adminNotes ? ` (Admin note: ${adminNotes})` : "");
      booking.status = "CANCELLED_BY_ADMIN";
      booking.cancelledAt = new Date();
      booking.cancelledBy = "ADMIN";
      booking.cancellationReason = reasonText;
      await booking.save();

      request.status = "APPROVED";
      request.adminNotes = adminNotes || "";
      request.reviewedAt = new Date();
      await request.save();

      await Promise.all([
        saveApprovedHistory(booking, "CANCELLED_BY_ADMIN", reasonText),
        saveAdminHistory(booking, "CANCELLED_BY_ADMIN", reasonText),
        Notifications.findOneAndUpdate(
          { booking: booking._id },
          {
            user: booking.user,
            booking: booking._id,
            bookingId: booking.bookingId || "",
            status: "CANCELLED_BY_ADMIN",
            material: booking.goodsData?.material || "",
            title: booking.goodsData?.title || "",
            orderQty: booking.orderQty || 0,
            estimatedAmount: booking.estimatedAmount || 0,
            reason: reasonText,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ),
        CancellationRequest.findByIdAndDelete(request._id),
      ]);


      dispatchRealTimeEvent(req.app, "cancellation_approved", {
        requestId: request._id,
        bookingId: booking.bookingId,
        status: "CANCELLED_BY_ADMIN",
      });

      return res.json({
        message: "Cancellation request approved and booking cancelled",
        request,
        booking,
      });
    } else {
      // Reject cancellation request
      request.status = "REJECTED";
      request.adminNotes = adminNotes || "";
      request.reviewedAt = new Date();
      await request.save();

      await Notifications.create({
        user: booking.user,
        booking: booking._id,
        bookingId: booking.bookingId || "",
        status: "CANCELLATION_REQUEST_REJECTED",
        material: booking.goodsData?.material || "",
        title: booking.goodsData?.title || "",
        orderQty: booking.orderQty || 0,
        estimatedAmount: booking.estimatedAmount || 0,
        reason: adminNotes || "Cancellation request rejected by admin",
      });

      dispatchRealTimeEvent(req.app, "cancellation_rejected", {
        requestId: request._id,
        bookingId: booking.bookingId,
        adminNotes,
      });

      return res.json({
        message: "Cancellation request rejected",
        request,
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to review cancellation request" });
  }
};

// Admin: delete cancellation request
export const deleteCancellationRequest = async (req, res) => {
  try {
    const request = await CancellationRequest.findByIdAndDelete(req.params.requestId);
    if (!request) {
      return res.status(404).json({ message: "Cancellation request not found" });
    }
    res.json({ message: "Cancellation request deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete cancellation request" });
  }
};



