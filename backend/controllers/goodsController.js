// controllers/goodsController.js
import Goods from "../models/Goods.js";
import Driver from "../models/Driver.js";
import mongoose from "mongoose";
import { deleteCloudinaryImageObjects } from "../utils/cloudinary.js";
import { getDefaultImage, isDefaultImage } from "../utils/defaultImages.js";

const validators = {
  Bricks:           (b) => b.title && b.brickType && b.howManyBricks && b.pricePerBrick,
  "M-Sand":         (b) => b.title && b.units && b.pricePerUnit,
  "River Sand":     (b) => b.title && b.units && b.pricePerUnit,
  "Dry Grass Rolls":(b) => b.title && b.noOfRolls && b.pricePerRoll,
};

const normalizeImages = (images) => (Array.isArray(images) ? images : images ? [images] : [])
  .map((image) => typeof image === "string" ? { url: image, publicId: "" } : { url: image?.url || "", publicId: image?.publicId || "" })
  .filter((image) => image.url)
  .slice(0, 4);

const hasTooManyImages = (images) => Array.isArray(images) && images.length > 4;

const getStockQuantity = (goods) => {
  if (goods.material === "Bricks") return Number(goods.howManyBricks) || 0;
  if (goods.material === "M-Sand" || goods.material === "River Sand") return Number(goods.units) || 0;
  if (goods.material === "Dry Grass Rolls") return Number(goods.noOfRolls) || 0;
  return Number(goods.availableLorries) || 0;
};

const getStockStatus = (goods) => {
  const quantity = getStockQuantity(goods);
  if (quantity <= 0) return "Full";
  if (quantity <= 2) return "Limited";
  return "Available";
};

const normalizeStoredGoods = (goods) => goods.map((item) => ({
  ...item,
  image: normalizeImages(Array.isArray(item.image) && item.image.length ? item.image : item.image || item.images).length
    ? normalizeImages(Array.isArray(item.image) && item.image.length ? item.image : item.image || item.images)
    : [getDefaultImage(item.material)],
}));

export const getGoods = async (req, res) => {
  if (req.query.summary === "true") {
    const total = await Goods.countDocuments();
    const payload = { total };
    return res.json(payload);
  }

  const goods = normalizeStoredGoods(await Goods.collection.find().sort({ createdAt: -1 }).toArray());
  await Goods.populate(goods, { path: "assignedDriver" });
  res.json(goods);
};

export const createGoods = async (req, res) => {
  try {
    const { material } = req.body;
    console.log("POST /api/goods", { material, image: req.body.image, assignedDriver: req.body.assignedDriver });
    if (!material || !validators[material])
      return res.status(400).json({ message: "Invalid material type" });
    if (!validators[material](req.body))
      return res.status(400).json({ message: "Please fill all required fields" });
    if (hasTooManyImages(req.body.image))
      return res.status(400).json({ message: "A product can have a maximum of 4 images" });
    const image = normalizeImages(req.body.image);
    const storedImages = image.length ? image : [getDefaultImage(material)];
    const availableLorries = material === "Dry Grass Rolls" ? 0 : Math.max(1, Number(req.body.availableLorries) || 1);
    let goods;
    try {
      goods = await Goods.create({
        material,
        status: getStockStatus({ material, ...req.body }),
        title: req.body.title,
        assignedDriver: req.body.assignedDriver || null,
        image: storedImages,
        location: req.body.location,
        brickType: req.body.brickType,
        howManyBricks: req.body.howManyBricks,
        pricePerBrick: req.body.pricePerBrick,
        units: req.body.units,
        pricePerUnit: req.body.pricePerUnit,
        noOfRolls: req.body.noOfRolls,
        pricePerRoll: req.body.pricePerRoll,
        availableLorries,
      });
    } catch (error) {
      await deleteCloudinaryImageObjects(image);
      throw error;
    }
    await goods.populate("assignedDriver");
    res.status(201).json(goods);
  } catch (error) {
    console.error("POST /api/goods failed:", error.stack || error);
    res.status(500).json({ message: error.message || "Failed to create goods" });
  }
};

export const updateGoods = async (req, res) => {
  const existingGoods = await Goods.findById(req.params.id);
  if (!existingGoods) return res.status(404).json({ message: "Goods not found" });
  if (hasTooManyImages(req.body.image))
    return res.status(400).json({ message: "A product can have a maximum of 4 images" });

  const images = normalizeImages(req.body.image);
  const storedImages = images.length ? images : [getDefaultImage(existingGoods.material)];
  const updates = {
    status: getStockStatus({ material: existingGoods.material, ...req.body }),
    title: req.body.title,
    assignedDriver: req.body.assignedDriver || null,
    image: storedImages,
    location: req.body.location,
    brickType: req.body.brickType,
    howManyBricks: req.body.howManyBricks,
    pricePerBrick: req.body.pricePerBrick,
    units: req.body.units,
    pricePerUnit: req.body.pricePerUnit,
    noOfRolls: req.body.noOfRolls,
    pricePerRoll: req.body.pricePerRoll,
  };
  let goods;
  try {
    goods = await Goods.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  } catch (error) {
    const existingIds = new Set((existingGoods.image || []).map((image) => image.publicId).filter(Boolean));
    await deleteCloudinaryImageObjects(images.filter((image) => image.publicId && !existingIds.has(image.publicId) && !isDefaultImage(image)));
    throw error;
  }
  const retainedImages = new Set(storedImages.map((image) => image.publicId || image.url));
  const removedImages = (existingGoods.image || []).filter((image) => !retainedImages.has(image.publicId || image.url));
  await deleteCloudinaryImageObjects(removedImages.filter((image) => !isDefaultImage(image)));
  await goods.populate("assignedDriver");
  res.json(goods);
};

export const deleteGoods = async (req, res) => {
  const rawGoods = await Goods.collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
  if (!rawGoods) return res.status(404).json({ message: "Goods not found" });
  const storedImages = Array.isArray(rawGoods?.image)
    ? rawGoods.image
    : rawGoods?.image ? [rawGoods.image] : rawGoods?.images || [];
  const legacyImages = storedImages.map((image, index) => typeof image === "string"
    ? { url: image, publicId: rawGoods?.imagePublicIds?.[index] || "" }
    : image);
  await deleteCloudinaryImageObjects(legacyImages.filter((image) => !isDefaultImage(image)));
  await Goods.collection.deleteOne({ _id: rawGoods._id });
  res.json({ message: "Goods deleted" });
};
