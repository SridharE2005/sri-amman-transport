import Notifications from "../models/Notifications.js";
import UsersHistory from "../models/UsersHistory.js";

const recentSince = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

export const getMyNotifications = async (req, res) => {
  const query = { user: req.user._id, updatedAt: { $gte: recentSince() } };
  const [notifications, usersHistory] = await Promise.all([
    Notifications.find(query).populate("booking", "bookingId").lean(),
    UsersHistory.find(query).populate("booking", "bookingId").lean(),
  ]);

  // Deduplicate entries by booking ID so notifications never appear twice
  const seenBookings = new Set();
  const merged = [];

  // Notifications has the most up-to-date cancellation/rejection info
  for (const item of notifications) {
    const key = String(item.booking?._id || item.booking || item.bookingId || item._id);
    if (!seenBookings.has(key)) {
      seenBookings.add(key);
      merged.push({ ...item, read: Boolean(item.read) });
    }
  }

  for (const item of usersHistory) {
    const key = String(item.booking?._id || item.booking || item.bookingId || item._id);
    if (!seenBookings.has(key)) {
      seenBookings.add(key);
      merged.push({ ...item, read: Boolean(item.read) });
    }
  }

  merged.sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));
  res.json(merged);
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    await Promise.all([
      Notifications.updateMany(
        { user: req.user._id, read: { $ne: true } },
        { $set: { read: true } }
      ),
      UsersHistory.updateMany(
        { user: req.user._id, read: { $ne: true } },
        { $set: { read: true } }
      ),
    ]);
    res.json({ message: "Notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to mark notifications as read" });
  }
};