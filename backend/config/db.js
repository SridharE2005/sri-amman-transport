// config/db.js
import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB connection failed. Check Atlas Network Access and credentials.");
    throw error;
  }
};

export default connectDB;