// controllers/messageController.js
import Message from "../models/Message.js";

// Public: user submits contact form
export const createMessage = async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message)
    return res.status(400).json({ message: "All fields are required" });
  const msg = await Message.create({ name, email, subject, message });
  res.status(201).json(msg);
};

// Admin: get all messages
export const getMessages = async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
};

// Admin: mark as read + optional reply
export const replyMessage = async (req, res) => {
  const msg = await Message.findByIdAndUpdate(
    req.params.id,
    { read: true, reply: req.body.reply || "" },
    { new: true }
  );
  if (!msg) return res.status(404).json({ message: "Message not found" });
  res.json(msg);
};

// Admin: mark all messages as read
export const markAllMessagesRead = async (req, res) => {
  try {
    await Message.updateMany({ read: { $ne: true } }, { $set: { read: true } });
    res.json({ message: "All messages marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark messages as read" });
  }
};

// Admin: delete message
export const deleteMessage = async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ message: "Message deleted" });
};
