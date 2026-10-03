import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarSeeds = [
  { id: "avatar_1", name: "Felix", seed: "Felix" },
  { id: "avatar_2", name: "Aneka", seed: "Aneka" },
  { id: "avatar_3", name: "Oliver", seed: "Oliver" },
  { id: "avatar_4", name: "Sophia", seed: "Sophia" },
  { id: "avatar_5", name: "Mason", seed: "Mason" },
  { id: "avatar_6", name: "Mia", seed: "Mia" },
  { id: "avatar_7", name: "Alexander", seed: "Alexander" },
  { id: "avatar_8", name: "Emma", seed: "Emma" },
];

console.log("Uploading default avatars to Cloudinary...");
const results = [];

for (const item of avatarSeeds) {
  try {
    const url = `https://api.dicebear.com/7.x/avataaars/png?seed=${item.seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
    const res = await cloudinary.uploader.upload(url, {
      folder: "transport-goods-defaults/avatars",
      public_id: item.id,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    });
    console.log(`Uploaded ${item.id}:`, res.secure_url);
    results.push({ id: item.id, name: item.name, url: res.secure_url });
  } catch (err) {
    console.error(`Failed ${item.id}:`, err.message);
  }
}

console.log("\nALL AVATARS:");
console.log(JSON.stringify(results, null, 2));
