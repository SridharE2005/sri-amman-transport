import dotenv from "dotenv";
import mongoose from "mongoose";
import Booking from "./models/Booking.js";
import AdminHistory from "./models/AdminHistory.js";

const migrate = async () => {
  dotenv.config();
  await mongoose.connect(process.env.MONGO_URI);

  const bookings = await Booking.find().lean();
  for (const booking of bookings) {
    await AdminHistory.updateOne(
      { booking: booking._id },
      {
        $set: {
          booking: booking._id,
          user: booking.user,
          customerName: booking.customerName || "",
          customerEmail: booking.customerEmail || "",
          customerPhone: booking.customerPhone || "",
          material: booking.goodsData?.material || "",
          title: booking.goodsData?.title || "",
          orderQty: booking.orderQty || 0,
          estimatedAmount: booking.estimatedAmount || 0,
          status: booking.status,
          reason: booking.status === "Rejected" ? booking.rejectionReason || "" : booking.status === "Revoked" ? booking.revokedReason || "" : "",
          driverData: booking.driverData || {},
        },
        $setOnInsert: { createdAt: booking.createdAt || new Date() },
      },
      { upsert: true }
    );
  }

  console.log(`Migrated ${bookings.length} booking(s) to AdminHistory.`);
  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error("Admin history migration failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});