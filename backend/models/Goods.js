// models/Goods.js
import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String, default: "" },
}, { _id: false });

const goodsSchema = new mongoose.Schema({
  material: { type: String, required: true, enum: ["Bricks", "M-Sand", "River Sand", "Dry Grass Rolls"] },
  status:   { type: String, enum: ["Available", "Limited", "Full"], default: "Available" },
  title:    { type: String, required: true },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", default: null },
  image: { type: [imageSchema], default: [] },

  // Bricks
  location:        { type: String, default: "" },
  brickType:       { type: String, default: "" },
  howManyBricks:   { type: Number, default: 0 },
  pricePerBrick:   { type: Number, default: 0 },

  // M-Sand / River Sand
  units:       { type: Number, default: 0 },
  pricePerUnit:{ type: Number, default: 0 },
  // availableLorries shared with Bricks

  // Dry Grass Rolls
  noOfRolls:   { type: Number, default: 0 },
  pricePerRoll:{ type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Goods", goodsSchema);
