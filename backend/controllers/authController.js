// controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendOtpMail } from "../utils/sendMail.js";
import { DEFAULT_AVATARS, isDefaultAvatar } from "../utils/defaultAvatars.js";
import { deleteCloudinaryImages } from "../utils/cloudinary.js";

// Return list of predefined default avatars stored on Cloudinary
export const getDefaultAvatarsList = (req, res) => {
  res.json(DEFAULT_AVATARS);
};

// Send OTP
export const sendOtp = async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required" });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  let user = await User.findOne({ email });
  if (user && user.isVerified) {
    return res.status(400).json({ message: "An account with this email already exists" });
  }

  if (!user) user = new User({ email });
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await user.save();
  await sendOtpMail(email, otp);
  res.json({ message: "OTP sent successfully" });
};

// Verify OTP + Register
export const verifyOtp = async (req, res) => {
  const { email, otp, password, firstName, lastName, phoneNumber, profileImage, avatarType } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date())
    return res.status(400).json({ message: "Invalid OTP" });

  user.firstName = firstName?.trim();
  user.lastName  = lastName?.trim();
  user.phoneNumber = phoneNumber ? phoneNumber.trim() : "";
  user.profileImage = profileImage || DEFAULT_AVATARS[0].url;
  user.avatarType = avatarType || (isDefaultAvatar(profileImage) ? "default" : "custom");
  user.password  = await bcrypt.hash(password, 10);
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  res.json({ message: "Account created successfully" });
};

// Login — returns token + full user profile
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.trim().toLowerCase() });

  if (!user || !user.isVerified)
    return res.status(400).json({ message: "User not found or not verified" });

  if (!(await bcrypt.compare(password, user.password)))
    return res.status(400).json({ message: "Wrong password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id:           user._id,
      firstName:    user.firstName,
      lastName:     user.lastName,
      email:        user.email,
      phoneNumber:  user.phoneNumber || "",
      profileImage: user.profileImage || DEFAULT_AVATARS[0].url,
      avatarType:   user.avatarType || (isDefaultAvatar(user.profileImage) ? "default" : "custom"),
      role:         user.role,
    },
  });
};

// Get current user from DB (protected)
export const getMe = (req, res) => {
  const { _id, firstName, lastName, email, phoneNumber, profileImage, avatarType, role, createdAt } = req.user;
  res.json({
    id: _id,
    firstName,
    lastName,
    email,
    phoneNumber: phoneNumber || "",
    profileImage: profileImage || DEFAULT_AVATARS[0].url,
    avatarType: avatarType || (isDefaultAvatar(profileImage) ? "default" : "custom"),
    role,
    createdAt,
  });
};

// User: update profile details
export const updateProfile = async (req, res) => {
  const { firstName, lastName, email, phoneNumber, profileImage, avatarType } = req.body;
  if (!firstName?.trim() || !lastName?.trim())
    return res.status(400).json({ message: "First name and last name are required" });

  req.user.firstName = firstName.trim();
  req.user.lastName = lastName.trim();

  if (typeof phoneNumber !== "undefined") {
    req.user.phoneNumber = phoneNumber ? phoneNumber.trim() : "";
  }

  if (profileImage) {
    const oldImage = req.user.profileImage;
    const oldType = req.user.avatarType;

    req.user.profileImage = profileImage;
    req.user.avatarType = avatarType || (isDefaultAvatar(profileImage) ? "default" : "custom");

    // Clean up old custom image from Cloudinary if changed
    if (oldType === "custom" && oldImage && oldImage !== profileImage && !isDefaultAvatar(oldImage)) {
      try {
        await deleteCloudinaryImages({ urls: [oldImage] });
      } catch (err) {
        console.error("Failed to delete old custom profile image from Cloudinary:", err.message);
      }
    }
  }

  // Allow email updates for regular users only (admin email is locked)
  if (req.user.role !== "admin" && email && email.trim().toLowerCase() !== req.user.email) {
    const trimmedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: trimmedEmail, _id: { $ne: req.user._id } });
    if (existingUser) return res.status(409).json({ message: "Email is already in use" });
    req.user.email = trimmedEmail;
  }

  await req.user.save();

  res.json({
    id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    phoneNumber: req.user.phoneNumber || "",
    profileImage: req.user.profileImage,
    avatarType: req.user.avatarType,
    role: req.user.role,
    createdAt: req.user.createdAt,
  });
};
