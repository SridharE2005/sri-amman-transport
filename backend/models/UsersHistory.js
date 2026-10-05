import mongoose from "mongoose";

const usersHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
  bookingId: { type: String, default: "" },
  status: {
    type: String,
    enum: [
      "Confirmed",
      "Revoked",
      "Delivered",
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "Cancelled by User",
      "Cancelled by Admin",
      "Rejected",
    ],
    required: true,
  },
  material: { type: String, default: "" },
  title: { type: String, default: "" },
  orderQty: { type: Number, default: 0 },
  estimatedAmount: { type: Number, default: 0 },
  reason: { type: String, default: "" },
  cancelledAt: { type: Date, default: null },
  cancelledBy: { type: String, default: null },
  cancellationReason: { type: String, default: null },
  driverData: {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    vehicle: { type: String, default: "" },
  },
  read: { type: Boolean, default: false },
}, { timestamps: true });

usersHistorySchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("UsersHistory", usersHistorySchema);