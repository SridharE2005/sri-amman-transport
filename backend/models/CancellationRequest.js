// models/CancellationRequest.js
import mongoose from "mongoose";

const cancellationRequestSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    bookingId: { type: String, default: "" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    reason: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    adminNotes: { type: String, default: "" },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

cancellationRequestSchema.index({ booking: 1, status: 1 });
cancellationRequestSchema.index({ user: 1, requestedAt: -1 });

export default mongoose.model("CancellationRequest", cancellationRequestSchema);
