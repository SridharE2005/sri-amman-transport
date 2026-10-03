import Notifications from "../models/Notifications.js";
import UsersHistory from "../models/UsersHistory.js";

const recentSince = () => new Date(Date.now() - 24 * 60 * 60 * 1000);

export const getMyNotifications = async (req, res) => {
  const query = { user: req.user._id, updatedAt: { $gte: recentSince() } };
  const [notifications, usersHistory] = await Promise.all([
    Notifications.find(query).populate("booking", "bookingId").lean(),
    UsersHistory.find(query).populate("booking", "bookingId").lean(),
  ]);

  res.json([...notifications, ...usersHistory].sort(
    (first, second) => new Date(second.updatedAt) - new Date(first.updatedAt)
  ));
};