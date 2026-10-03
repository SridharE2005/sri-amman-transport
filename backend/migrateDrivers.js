import dotenv from "dotenv";
import mongoose from "mongoose";
import Driver from "./models/Driver.js";

const migrate = async () => {
  dotenv.config();
  await mongoose.connect(process.env.MONGO_URI);

  const result = await Driver.collection.updateMany(
    {},
    { $unset: { license: "", route: "", routes: "" } }
  );

  console.log(`Removed sensitive and route fields from ${result.modifiedCount} driver record(s).`);
  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error("Driver migration failed:", error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});