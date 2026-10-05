// models/DriverCheckIn.js
import mongoose from "mongoose";

const driverCheckInSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkedOutAt: {
      type: Date,
      default: null,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    speed: {
      type: Number,
      default: null,
    },
    heading: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["CHECKED IN", "NOT CHECKED IN"],
      default: "CHECKED IN",
    },
  },
  { timestamps: true }
);

driverCheckInSchema.index({ driverId: 1, checkInTime: -1 });

export default mongoose.model("DriverCheckIn", driverCheckInSchema);
