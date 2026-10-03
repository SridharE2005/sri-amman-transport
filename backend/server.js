import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import goodsRoutes from "./routes/goodsRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminHistoryRoutes from "./routes/adminHistoryRoutes.js";
import { verifyMailTransport } from "./utils/sendMail.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000","https://passive-compared-scheduling-lets.trycloudflare.com"], credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/goods", goodsRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin-history", adminHistoryRoutes);

app.use((error, req, res, next) => {
  console.error("API request failed:", error);
  if (res.headersSent) return next(error);
  res.status(500).json({ message: error.message || "Internal server error" });
});

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);

verifyMailTransport()
  .then(() => console.log("SMTP connection verified"))
  .catch((error) => console.error("SMTP connection failed:", error.message));
