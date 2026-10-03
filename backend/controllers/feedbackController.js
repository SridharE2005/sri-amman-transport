import Feedback from "../models/Feedback.js";
import Booking from "../models/Booking.js";

const ensureAdmin = (req, res) => {
  if (req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return false;
  }
  return true;
};

export const createFeedback = async (req, res) => {
  const { bookingId, customerName, serviceReview, improvement, rating } = req.body;
  const numericRating = Number(rating);
  if (!bookingId || !customerName?.trim() || !serviceReview?.trim() || !Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5)
    return res.status(400).json({ message: "Name, review and a rating from 1 to 5 are required" });

  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, status: "Delivered" });
  if (!booking) return res.status(400).json({ message: "Feedback is available only for your delivered bookings" });

  const existing = await Feedback.findOne({ booking: bookingId });
  if (existing) return res.status(409).json({ message: "Feedback has already been submitted for this booking" });

  const feedback = await Feedback.create({ booking: bookingId, user: req.user._id, customerName: customerName.trim(), serviceReview: serviceReview.trim(), improvement: improvement?.trim() || "", rating: numericRating });
  res.status(201).json(feedback);
};

export const getMyFeedback = async (req, res) => {
  const feedback = await Feedback.find({ user: req.user._id }).select("booking rating");
  res.json(feedback);
};

export const getAllFeedback = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  const feedback = await Feedback.find()
    .populate("user", "firstName lastName email")
    .populate("booking", "material title customerName createdAt")
    .sort({ createdAt: -1 });
  res.json(feedback);
};
