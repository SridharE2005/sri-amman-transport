import Driver from "../models/Driver.js";
import User from "../models/User.js";
import DriverCheckIn from "../models/DriverCheckIn.js";
import bcrypt from "bcryptjs";
import { deleteCloudinaryImages } from "../utils/cloudinary.js";
import { getIO } from "../socket.js";

// Admin / Public: get all drivers
export const getDrivers = async (req, res) => {
  if (req.query.summary === "true") {
    const [total, onDuty] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ status: "On Duty" }),
    ]);
    const payload = { total, onDuty };
    return res.json(payload);
  }

  const drivers = await Driver.find()
    .populate("user", "email fullName vehicleNumber vehicleType district status isCheckedIn checkedInAt tracking lastLocation")
    .sort({ createdAt: -1 });

  const mapped = drivers.map((d) => {
    const u = d.user || {};
    return {
      _id: d._id,
      id: d._id,
      name: d.name,
      email: d.email || u.email || "",
      phone: d.phone,
      vehicle: d.vehicle,
      vehicleNumber: d.vehicleNumber || u.vehicleNumber || "",
      vehicleType: d.vehicleType || u.vehicleType || "",
      district: d.district || u.district || "",
      experience: d.experience,
      profileImage: d.profileImage,
      profileImagePublicId: d.profileImagePublicId,
      status: u.status || d.status || "NOT CHECKED IN",
      driverStatus: u.status || "NOT CHECKED IN",
      dutyStatus: d.status || "Available",
      isCheckedIn: Boolean(u.isCheckedIn || u.status === "CHECKED IN"),
      checkedInAt: u.checkedInAt || null,
      tracking: u.tracking || null,
      lastLocation: u.lastLocation || null,
      role: "driver",
      userId: u._id || d.user || null,
      createdAt: d.createdAt,
    };
  });

  res.json(mapped);
};

// Admin: get single driver by ID (supports Driver._id or User._id)
export const getDriverById = async (req, res) => {
  const { id } = req.params;
  let driver = null;
  let user = null;

  try {
    // 1. Try finding by Driver _id
    driver = await Driver.findById(id).populate("user");
    if (driver) {
      if (driver.user && typeof driver.user === "object") {
        user = driver.user;
      } else if (driver.user) {
        user = await User.findById(driver.user);
      } else if (driver.email) {
        user = await User.findOne({ email: driver.email.toLowerCase() });
      }
    } else {
      // 2. Try finding by User _id
      user = await User.findById(id);
      if (user) {
        driver = await Driver.findOne({ user: user._id });
        if (!driver && user.email) {
          driver = await Driver.findOne({ email: user.email.toLowerCase() });
        }
      }
    }

    if (!driver && !user) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const u = user || {};
    const d = driver || {};

    const isCheckedIn = Boolean(u.isCheckedIn || u.status === "CHECKED IN");

    res.json({
      _id: d._id || u._id,
      id: d._id || u._id,
      driverId: d._id || null,
      userId: u._id || null,
      name: d.name || u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Driver",
      email: d.email || u.email || "",
      phone: d.phone || u.phoneNumber || "",
      vehicle: d.vehicle || (u.vehicleNumber ? `${u.vehicleType || "Lorry"} (${u.vehicleNumber})` : "Lorry"),
      vehicleNumber: d.vehicleNumber || u.vehicleNumber || "",
      vehicleType: d.vehicleType || u.vehicleType || "Lorry",
      district: d.district || u.district || "Salem",
      experience: d.experience || "1+ Years",
      profileImage: d.profileImage || u.profileImage || "",
      profileImagePublicId: d.profileImagePublicId || "",
      status: isCheckedIn ? "CHECKED IN" : (u.status || d.status || "NOT CHECKED IN"),
      driverStatus: isCheckedIn ? "CHECKED IN" : (u.status || "NOT CHECKED IN"),
      dutyStatus: d.status || (isCheckedIn ? "On Duty" : "Available"),
      isOnline: Boolean(u.tracking?.isOnline && isCheckedIn),
      isCheckedIn,
      checkedInAt: u.checkedInAt || null,
      checkedOutAt: u.checkedOutAt || null,
      tracking: u.tracking || null,
      lastLocation: u.lastLocation || null,
      createdAt: d.createdAt || u.createdAt,
    });
  } catch (err) {
    console.error("[DriverController] getDriverById error:", err);
    res.status(500).json({ message: "Failed to fetch driver details: " + err.message });
  }
};

// Admin: create driver account (creates User with role: 'driver' and Driver record)
export const createDriver = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    phoneNumber,
    vehicleNumber,
    vehicleType,
    district,
    experience,
    profileImage,
    profileImagePublicId,
  } = req.body;

  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase();
  const trimmedPassword = password?.trim();
  const trimmedPhone = (phone || phoneNumber)?.trim();
  const trimmedVehicleNumber = (vehicleNumber || req.body.vehicle)?.trim();
  const trimmedVehicleType = (vehicleType || "Lorry")?.trim();
  const trimmedDistrict = district?.trim();

  if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedPhone || !trimmedVehicleNumber || !trimmedVehicleType || !trimmedDistrict) {
    return res.status(400).json({
      message: "Please fill all required fields: Full Name, Email, Password, Phone Number, Vehicle Number, Vehicle Type, and District.",
    });
  }

  if (trimmedPassword.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  // Check email uniqueness in User collection
  const existingUser = await User.findOne({ email: trimmedEmail });
  if (existingUser) {
    return res.status(400).json({ message: "An account with this email already exists" });
  }

  // Hash password using existing bcrypt mechanism
  const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

  const nameParts = trimmedName.split(" ");
  const firstName = nameParts[0] || trimmedName;
  const lastName = nameParts.slice(1).join(" ") || "";
  const vehicleLabel = `${trimmedVehicleType} (${trimmedVehicleNumber})`;

  // 1. Create User account with role: 'driver'
  const user = await User.create({
    firstName,
    lastName,
    fullName: trimmedName,
    email: trimmedEmail,
    password: hashedPassword,
    phoneNumber: trimmedPhone,
    vehicleNumber: trimmedVehicleNumber,
    vehicleType: trimmedVehicleType,
    district: trimmedDistrict,
    role: "driver",
    isVerified: true,
    status: "NOT CHECKED IN",
    profileImage: profileImage || "",
  });

  // 2. Create Driver record for operational compatibility with Goods assignment
  const driver = await Driver.create({
    name: trimmedName,
    email: trimmedEmail,
    phone: trimmedPhone,
    vehicle: vehicleLabel,
    vehicleNumber: trimmedVehicleNumber,
    vehicleType: trimmedVehicleType,
    district: trimmedDistrict,
    experience: experience || "1+ Years",
    profileImage: profileImage || "",
    profileImagePublicId: profileImagePublicId || "",
    status: "Available",
    user: user._id,
  });

  user.driverId = driver._id;
  await user.save();

  res.status(201).json({
    message: "Driver created successfully",
    driver: {
      _id: driver._id,
      id: driver._id,
      name: driver.name,
      email: user.email,
      phone: driver.phone,
      vehicle: driver.vehicle,
      vehicleNumber: user.vehicleNumber,
      vehicleType: user.vehicleType,
      district: user.district,
      role: user.role,
      status: user.status,
      userId: user._id,
    },
  });
};

// Admin: update driver
export const updateDriver = async (req, res) => {
  const existingDriver = await Driver.findById(req.params.id);
  if (!existingDriver) return res.status(404).json({ message: "Driver not found" });

  const {
    name,
    email,
    password,
    phone,
    phoneNumber,
    vehicleNumber,
    vehicleType,
    district,
    experience,
    profileImage,
    profileImagePublicId,
  } = req.body;

  const trimmedName = name?.trim() || existingDriver.name;
  const trimmedEmail = email ? email.trim().toLowerCase() : existingDriver.email;
  const trimmedPhone = (phone || phoneNumber)?.trim() || existingDriver.phone;
  const trimmedVehicleNumber = (vehicleNumber || req.body.vehicle)?.trim() || existingDriver.vehicleNumber;
  const trimmedVehicleType = (vehicleType || "Lorry")?.trim() || existingDriver.vehicleType;
  const trimmedDistrict = district?.trim() || existingDriver.district;
  const vehicleLabel = `${trimmedVehicleType} (${trimmedVehicleNumber})`;

  // If email is changed, check for conflict
  if (trimmedEmail && trimmedEmail !== existingDriver.email) {
    const emailConflict = await User.findOne({ email: trimmedEmail, _id: { $ne: existingDriver.user } });
    if (emailConflict) {
      return res.status(400).json({ message: "Email is already taken by another user" });
    }
  }

  // Update Driver model
  existingDriver.name = trimmedName;
  existingDriver.email = trimmedEmail;
  existingDriver.phone = trimmedPhone;
  existingDriver.vehicle = vehicleLabel;
  existingDriver.vehicleNumber = trimmedVehicleNumber;
  existingDriver.vehicleType = trimmedVehicleType;
  existingDriver.district = trimmedDistrict;
  if (experience) existingDriver.experience = experience;
  if (profileImage) existingDriver.profileImage = profileImage;
  if (profileImagePublicId) existingDriver.profileImagePublicId = profileImagePublicId;
  await existingDriver.save();

  // Also update corresponding User account if linked
  if (existingDriver.user) {
    const user = await User.findById(existingDriver.user);
    if (user) {
      const nameParts = trimmedName.split(" ");
      user.firstName = nameParts[0] || trimmedName;
      user.lastName = nameParts.slice(1).join(" ") || "";
      user.fullName = trimmedName;
      user.email = trimmedEmail;
      user.phoneNumber = trimmedPhone;
      user.vehicleNumber = trimmedVehicleNumber;
      user.vehicleType = trimmedVehicleType;
      user.district = trimmedDistrict;
      if (password && password.trim().length >= 6) {
        user.password = await bcrypt.hash(password.trim(), 10);
      }
      if (profileImage) user.profileImage = profileImage;
      await user.save();
    }
  }

  res.json({ message: "Driver updated successfully", driver: existingDriver });
};

// Admin: delete driver
export const deleteDriver = async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found" });

  if (driver.profileImage) {
    await deleteCloudinaryImages({ urls: [driver.profileImage], publicIds: [driver.profileImagePublicId] });
  }

  if (driver.user) {
    await User.findByIdAndDelete(driver.user);
  } else if (driver.email) {
    await User.findOneAndDelete({ email: driver.email.toLowerCase() });
  }

  await Driver.findByIdAndDelete(req.params.id);
  res.json({ message: "Driver removed successfully" });
};

// Driver: get current driver profile and status
export const getDriverProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  let driver = null;
  if (user.driverId) {
    driver = await Driver.findById(user.driverId);
  }
  if (!driver) {
    driver = await Driver.findOne({ user: user._id });
  }
  if (!driver && user.email) {
    driver = await Driver.findOne({ email: user.email.toLowerCase() });
  }

  const profileImage =
    user.profileImage ||
    driver?.profileImage ||
    "";

  res.json({
    id: user._id,
    driverId: driver?._id || user.driverId || null,
    name: user.fullName || driver?.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.email,
    phone: user.phoneNumber || driver?.phone || "",
    vehicleNumber: user.vehicleNumber || driver?.vehicleNumber || "",
    vehicleType: user.vehicleType || driver?.vehicleType || "Lorry",
    district: user.district || driver?.district || "",
    experience: driver?.experience || "1+ Years",
    profileImage,
    profileImagePublicId: driver?.profileImagePublicId || "",
    status: user.status || "NOT CHECKED IN",
    isCheckedIn: Boolean(user.isCheckedIn || user.status === "CHECKED IN"),
    checkedInAt: user.checkedInAt || null,
    checkedOutAt: user.checkedOutAt || null,
    lastLocation: user.lastLocation || null,
    tracking: user.tracking || null,
    role: user.role,
  });
};

// Driver: Check in with required GPS coordinates
export const checkInDriver = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { latitude, longitude, accuracy, speed, heading } = req.body;

  // Validate GPS coordinates
  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  if (isNaN(latNum) || isNaN(lngNum) || latitude === undefined || longitude === undefined) {
    return res.status(400).json({
      message: "Valid GPS latitude and longitude are required to check in.",
    });
  }

  // Official check-in time generated by server clock
  const serverCheckInTime = new Date();

  // Create DriverCheckIn record
  const checkInRecord = await DriverCheckIn.create({
    driverId: user._id,
    checkInTime: serverCheckInTime,
    latitude: latNum,
    longitude: lngNum,
    accuracy: Number(accuracy) || 0,
    speed: speed !== null && speed !== undefined && !isNaN(Number(speed)) ? Number(speed) : null,
    heading: heading !== null && heading !== undefined && !isNaN(Number(heading)) ? Number(heading) : null,
    status: "CHECKED IN",
  });

  // Update User state & TASK 4 tracking info
  user.isCheckedIn = true;
  user.status = "CHECKED IN";
  user.checkedInAt = serverCheckInTime;
  user.checkedOutAt = null;
  user.currentCheckInId = checkInRecord._id;
  user.lastLocation = {
    latitude: latNum,
    longitude: lngNum,
    accuracy: Number(accuracy) || 0,
    speed: speed !== null && speed !== undefined && !isNaN(Number(speed)) ? Number(speed) : null,
    heading: heading !== null && heading !== undefined && !isNaN(Number(heading)) ? Number(heading) : null,
    updatedAt: serverCheckInTime,
  };
  user.tracking = {
    isOnline: true,
    latitude: latNum,
    longitude: lngNum,
    accuracy: Number(accuracy) || 0,
    speed: speed !== null && speed !== undefined && !isNaN(Number(speed)) ? Number(speed) : null,
    heading: heading !== null && heading !== undefined && !isNaN(Number(heading)) ? Number(heading) : null,
    lastUpdated: serverCheckInTime,
    checkedInAt: serverCheckInTime,
    checkedOutAt: null,
  };
  await user.save();

  // Sync Driver fleet record to On Duty
  if (user.driverId) {
    await Driver.findByIdAndUpdate(user.driverId, { status: "On Duty" });
  } else {
    await Driver.findOneAndUpdate({ user: user._id }, { status: "On Duty" });
  }

  // Broadcast real-time status change to admins room via Socket.IO
  try {
    const io = getIO();
    if (io) {
      io.to("admins").emit("admin:driver_status_change", {
        driverId: user._id,
        driverName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        vehicleNumber: user.vehicleNumber || "",
        status: "CHECKED IN",
        isOnline: true,
        latitude: latNum,
        longitude: lngNum,
        speed: speed !== null && speed !== undefined && !isNaN(Number(speed)) ? Number(speed) : null,
        lastUpdated: serverCheckInTime.toISOString(),
      });
    }
  } catch (socketErr) {
    console.warn("[DriverController] Could not broadcast check-in event:", socketErr.message);
  }

  res.status(201).json({
    message: "Driver checked in successfully",
    status: "CHECKED IN",
    isCheckedIn: true,
    checkInTime: serverCheckInTime,
    latitude: latNum,
    longitude: lngNum,
    accuracy: checkInRecord.accuracy,
    checkInId: checkInRecord._id,
    tracking: user.tracking,
  });
};

// Driver: Check out and finish shift
export const checkOutDriver = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const serverCheckOutTime = new Date();

  if (user.currentCheckInId) {
    await DriverCheckIn.findByIdAndUpdate(user.currentCheckInId, {
      checkedOutAt: serverCheckOutTime,
      status: "NOT CHECKED IN",
    });
  } else {
    await DriverCheckIn.findOneAndUpdate(
      { driverId: user._id, status: "CHECKED IN" },
      { checkedOutAt: serverCheckOutTime, status: "NOT CHECKED IN" },
      { sort: { checkInTime: -1 } }
    );
  }

  user.isCheckedIn = false;
  user.status = "NOT CHECKED IN";
  user.checkedOutAt = serverCheckOutTime;
  user.currentCheckInId = null;

  // TASK 5: Set isOnline = false, Save checkedOutAt
  if (!user.tracking) {
    user.tracking = {
      isOnline: false,
      latitude: null,
      longitude: null,
      accuracy: 0,
      speed: null,
      heading: null,
      lastUpdated: serverCheckOutTime,
      checkedInAt: user.checkedInAt || null,
      checkedOutAt: serverCheckOutTime,
    };
  } else {
    user.tracking.isOnline = false;
    user.tracking.checkedOutAt = serverCheckOutTime;
    user.tracking.lastUpdated = serverCheckOutTime;
  }
  await user.save();

  // Sync Driver fleet record to Available
  if (user.driverId) {
    await Driver.findByIdAndUpdate(user.driverId, { status: "Available" });
  } else {
    await Driver.findOneAndUpdate({ user: user._id }, { status: "Available" });
  }

  // Broadcast real-time status change to admins room via Socket.IO
  try {
    const io = getIO();
    if (io) {
      io.to("admins").emit("admin:driver_status_change", {
        driverId: user._id,
        driverName: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        vehicleNumber: user.vehicleNumber || "",
        status: "NOT CHECKED IN",
        isOnline: false,
        lastUpdated: serverCheckOutTime.toISOString(),
      });
    }
  } catch (socketErr) {
    console.warn("[DriverController] Could not broadcast checkout event:", socketErr.message);
  }

  res.json({
    message: "Driver checked out successfully",
    status: "NOT CHECKED IN",
    isCheckedIn: false,
    checkedOutAt: serverCheckOutTime,
    tracking: user.tracking,
  });
};
