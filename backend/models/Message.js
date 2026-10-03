// models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  reply:   { type: String, default: "" },
}, { timestamps: true });

export default mongoose.model("Message", messageSchema);
