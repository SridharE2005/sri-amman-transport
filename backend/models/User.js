// models/User.js
import mongoose from "mongoose";
import { DEFAULT_AVATARS } from "../utils/defaultAvatars.js";

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  phoneNumber: { type: String, default: "" },
  profileImage: { type: String, default: DEFAULT_AVATARS[0].url },
  avatarType: { type: String, enum: ["default", "custom"], default: "default" },
  password: String,
  role: { type: String, default: "user" },
  otp: String,
  otpExpiresAt: Date,
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("User", userSchema);