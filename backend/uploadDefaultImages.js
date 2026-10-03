import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../frontend/src/assets");
const defaults = [
  ["Bricks", "bricks.png", "transport-goods-defaults/bricks", "DEFAULT_BRICKS_IMAGE_URL"],
  ["M-Sand", "msand.png", "transport-goods-defaults/m-sand", "DEFAULT_MSAND_IMAGE_URL"],
  ["River Sand", "riversand.png", "transport-goods-defaults/river-sand", "DEFAULT_RIVER_SAND_IMAGE_URL"],
  ["Dry Grass Rolls", "drygrass.png", "transport-goods-defaults/dry-grass-rolls", "DEFAULT_DRY_GRASS_IMAGE_URL"],
];

const required = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing backend/.env values: ${missing.join(", ")}`);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

for (const [material, filename, publicId, envKey] of defaults) {
  const result = await cloudinary.uploader.upload(path.join(root, filename), {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    resource_type: "image",
  });
  console.log(`${envKey}=${result.secure_url}`);
  console.log(`VITE_${envKey}=${result.secure_url}`);
  console.log(`${material}: ${result.secure_url}`);
}