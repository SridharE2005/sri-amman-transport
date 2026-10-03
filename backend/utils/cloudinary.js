import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

export const getPublicId = (url) => {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  try {
    const path = new URL(url).pathname;
    const uploadIndex = path.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    const segments = path.slice(uploadIndex + "/upload/".length).split("/");
    if (segments[0]?.startsWith("v") && /^v\d+$/.test(segments[0])) segments.shift();
    const publicId = segments.join("/");
    return publicId.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

export const deleteCloudinaryImages = async ({ urls = [], publicIds = [] } = {}) => {
  const ids = [...new Set([...publicIds.filter(Boolean), ...urls.map(getPublicId).filter(Boolean)])];
  if (!ids.length) return;

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary credentials are missing from backend/.env");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  await Promise.all(ids.map(async (publicId) => {
    try {
      await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
    } catch (error) {
      console.error(`Cloudinary image cleanup failed for ${publicId}:`, error.message);
    }
  }));
};

export const deleteCloudinaryImageObjects = async (images = []) => {
  await deleteCloudinaryImages({
    urls: images.map((image) => typeof image === "string" ? image : image?.url),
    publicIds: images.map((image) => typeof image === "string" ? "" : image?.publicId),
  });
};