// controllers/driverController.js
import Driver from "../models/Driver.js";
import { deleteCloudinaryImages } from "../utils/cloudinary.js";

export const getDrivers = async (req, res) => {
  if (req.query.summary === "true") {
    const [total, onDuty] = await Promise.all([
      Driver.countDocuments(),
      Driver.countDocuments({ status: "On Duty" }),
    ]);
    const payload = { total, onDuty };
    return res.json(payload);
  }

  const drivers = await Driver.find().sort({ createdAt: -1 });
  res.json(drivers);
};

export const createDriver = async (req, res) => {
  const { name, phone, vehicle, experience, profileImage, profileImagePublicId } = req.body;
  if (!name || !phone || !vehicle || !experience)
    return res.status(400).json({ message: "All fields are required" });
  const driver = await Driver.create({ name, phone, vehicle, experience, profileImage: profileImage || "", profileImagePublicId: profileImagePublicId || "" });
  res.status(201).json(driver);
};

export const updateDriver = async (req, res) => {
  const existingDriver = await Driver.findById(req.params.id);
  if (!existingDriver) return res.status(404).json({ message: "Driver not found" });

  const updates = { ...req.body };
  delete updates.license;
  delete updates.status;
  delete updates.route;
  delete updates.routes;
  const driver = await Driver.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (Object.prototype.hasOwnProperty.call(updates, "profileImage") && updates.profileImage !== existingDriver.profileImage)
    await deleteCloudinaryImages({ urls: [existingDriver.profileImage], publicIds: [existingDriver.profileImagePublicId] });
  res.json(driver);
};

export const deleteDriver = async (req, res) => {
  const driver = await Driver.findById(req.params.id);
  if (!driver) return res.status(404).json({ message: "Driver not found" });
  await deleteCloudinaryImages({ urls: [driver.profileImage], publicIds: [driver.profileImagePublicId] });
  await Driver.findByIdAndDelete(req.params.id);
  res.json({ message: "Driver removed" });
};
