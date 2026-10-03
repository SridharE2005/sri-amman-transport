// models/Booking.js
import mongoose from "mongoose";

const goodsSnapshotSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  material: String,
  title: String,
  location: String,
  unitPrice: Number,
}, { _id: false });

const driverSnapshotSchema = new mongoose.Schema({
  name: String,
  phone: String,
  vehicle: String,
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  goodsData: { type: goodsSnapshotSchema, required: true },
  driverData: { type: driverSnapshotSchema, default: null },
  status: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Rejected",
      "Revoked",
      "Delivered",
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "PENDING",
      "CONFIRMED",
      "ASSIGNED",
      "IN_PROGRESS",
      "COMPLETED",
      "REJECTED",
    ],
    default: "Pending",
  },
  approvedAt: {
    type: Date,
    default: null,
  },
  cancellationDeadline: {
    type: Date,
    default: null,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelledBy: {
    type: String,
    enum: ["USER", "ADMIN", null],
    default: null,
  },
  cancellationReason: {
    type: String,
    default: null,
  },
  rejectionReason: { type: String, default: "" },
  revokedReason: { type: String, default: "" },
  revokedAt: { type: Date, default: null },

  // customer order details
  customerName:  { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  orderQty:      { type: Number, default: 0 },   // bricks / rolls / units requested
  estimatedAmount: { type: Number, default: 0 },
  deliveryAddress: { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
