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

// Admin: delete message
export const deleteMessage = async (req, res) => {
  await Message.findByIdAndDelete(req.params.id);
  res.json({ message: "Message deleted" });
};
