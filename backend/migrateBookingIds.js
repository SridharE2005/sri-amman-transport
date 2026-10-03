// migrateBookingIds.js
import dotenv from "dotenv";
import mongoose from "mongoose";
import Booking from "./models/Booking.js";
import { generateUniqueBookingId } from "./utils/generateBookingId.js";

const migrateBookingIds = async () => {
  dotenv.config();
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB. Checking existing bookings for missing bookingId...");

  // Match existing documents where bookingId does not exist, is null, or is empty string
  const filter = {
    $or: [
      { bookingId: { $exists: false } },
      { bookingId: null },
      { bookingId: "" },
    ],
  };

  const existingBookings = await Booking.collection.find(filter).toArray();
  console.log(`Found ${existingBookings.length} booking(s) requiring a bookingId.`);

  let migratedCount = 0;
  for (const booking of existingBookings) {
    // Preserve the original date if createdAt exists, otherwise use current date
    const bookingDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
    const newBookingId = await generateUniqueBookingId(bookingDate);

    // Update in-place without deleting or recreating the document
    await Booking.collection.updateOne(
      { _id: booking._id },
      { $set: { bookingId: newBookingId } }
    );
    migratedCount++;
    console.log(`[${migratedCount}/${existingBookings.length}] Updated booking ${booking._id} -> ${newBookingId}`);
  }

  // Ensure unique index is safely created now that every document has a unique bookingId
  console.log("Ensuring unique index on bookingId...");
  await Booking.collection.createIndex({ bookingId: 1 }, { unique: true });

  console.log(`Migration complete: ${migratedCount} existing booking(s) updated safely.`);
  await mongoose.disconnect();
};

migrateBookingIds().catch(async (error) => {
  console.error("Booking ID migration failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
