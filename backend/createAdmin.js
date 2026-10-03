// createAdmin.js
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();
    const email = process.env.ADMIN_EMAIL || "elumalaitn30r0834@gmail.com";
    const password = process.env.ADMIN_PASSWORD || "elumalai@123";
    const hashed = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate({ email }, {
      firstName: "Elumalai",
      lastName: "A",
      email,
      password: hashed,
      role: "admin",
      isVerified: true,
      otp: undefined,
    }, { upsert: true, new: true, setDefaultsOnInsert: true });

    console.log(`Admin account ready: ${email}`);
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

createAdmin();