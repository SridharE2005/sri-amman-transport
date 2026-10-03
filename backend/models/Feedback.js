import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true, trim: true },
  serviceReview: { type: String, required: true, trim: true },
  improvement: { type: String, default: "", trim: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);
