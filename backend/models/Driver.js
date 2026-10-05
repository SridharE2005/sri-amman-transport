// models/Driver.js
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  profileImage: { type: String, default: "" },
  profileImagePublicId: { type: String, default: "" },
  phone:      { type: String, required: true },
  email:      { type: String, default: "" },
  vehicle:    { type: String, required: true },
  vehicleNumber: { type: String, default: "" },
  vehicleType:   { type: String, default: "" },
  district:      { type: String, default: "" },
  experience: { type: String, default: "1+ Years" },
  status:     { type: String, default: "Available" },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

export default mongoose.model("Driver", driverSchema);
