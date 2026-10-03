import mongoose from "mongoose";

const adminHistorySchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
  bookingId: { type: String, default: "" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, default: "" },
  customerEmail: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  material: { type: String, default: "" },
  title: { type: String, default: "" },
  orderQty: { type: Number, default: 0 },
  estimatedAmount: { type: Number, default: 0 },
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
      "Cancelled by User",
      "Cancelled by Admin",
    ],
    required: true,
  },
  reason: { type: String, default: "" },
  cancelledAt: { type: Date, default: null },
  cancelledBy: { type: String, default: null },
  cancellationReason: { type: String, default: null },
  driverData: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    vehicle: { type: String, default: "" },
  },
}, { timestamps: true });

adminHistorySchema.index({ status: 1, updatedAt: -1 });

export default mongoose.model("AdminHistory", adminHistorySchema);