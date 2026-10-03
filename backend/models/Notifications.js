import mongoose from "mongoose";

const notificationsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
  bookingId: { type: String, default: "" },
  status: {
    type: String,
    enum: [
      "Rejected",
      "Revoked",
      "Confirmed",
      "Delivered",
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "Cancelled by User",
      "Cancelled by Admin",
      "CANCELLATION_REQUEST_APPROVED",
      "CANCELLATION_REQUEST_REJECTED",
    ],
    required: true,
    default: "Rejected",
  },
  material: { type: String, default: "" },
  title: { type: String, default: "" },
  orderQty: { type: Number, default: 0 },
  estimatedAmount: { type: Number, default: 0 },
  reason: { type: String, default: "" },
}, { timestamps: true });

notificationsSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("Notifications", notificationsSchema);