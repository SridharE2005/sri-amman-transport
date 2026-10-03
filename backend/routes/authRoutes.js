// routes/authRoutes.js
import express from "express";
import {
  sendOtp,
  verifyOtp,
  loginUser,
  getMe,
  updateProfile,
  getDefaultAvatarsList,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/default-avatars", getDefaultAvatarsList);
router.post("/send-otp",       sendOtp);
router.post("/verify-otp",     verifyOtp);
router.post("/login",          loginUser);
router.get("/me",              protect, getMe);
router.put("/profile",         protect, updateProfile);

export default router;
