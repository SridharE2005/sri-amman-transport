// models/Driver.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  profileImage: { type: String, default: "" },
  profileImagePublicId: { type: String, default: "" },
  phone:      { type: String, required: true },
  vehicle:    { type: String, required: true },
  experience: { type: String, required: true },
  status:     { type: String, enum: ["Available", "On Duty", "Off Duty"], default: "Available" },
}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);
