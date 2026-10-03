import { finishRequest, startRequest } from "./requestTracker";
import imageCompression from "browser-image-compression";

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 2000,
  initialQuality: 0.8,
  useWebWorker: true,
  fileType: "image/jpeg",
};

export async function uploadImages(files, folder, { alreadyCompressed = false } = {}) {
  let uploadTitle = "Uploading Image";
  let uploadMessage = "Uploading image to secure cloud storage…";

  if (folder === "user-profiles" || folder === "avatars") {
    uploadTitle = "Uploading Avatar";
    uploadMessage = "Uploading profile photo to secure storage…";
  } else if (folder === "transport-drivers") {
    uploadTitle = "Uploading Driver Photo";
    uploadMessage = "Uploading driver portrait photo…";
  } else if (folder === "transport-goods") {
    uploadTitle = files?.length > 1 ? "Uploading Material Images" : "Uploading Material Image";
    uploadMessage = files?.length > 1 
      ? `Uploading ${files.length} material photos to Cloudinary…`
      : "Uploading material photo to Cloudinary…";
  }

  const requestId = startRequest({ title: uploadTitle, message: uploadMessage });
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  try {
    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary cloud name or upload preset is missing");
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    return await Promise.all(files.map(async (file) => {
      const compressedFile = alreadyCompressed ? file : await imageCompression(file, compressionOptions);
      const formData = new FormData();
      formData.append("file", compressedFile, file.name.replace(/\.[^.]+$/, ".jpg"));
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", folder);

      const response = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) {
        const message = data.error?.message || "Cloudinary upload failed";
        if (message.toLowerCase().includes("whitelisted for unsigned")) {
          throw new Error("Cloudinary upload preset must be set to Unsigned");
        }
        throw new Error(message);
      }
      if (!data.secure_url) throw new Error("Cloudinary did not return an image URL");
      return { url: data.secure_url, publicId: data.public_id || "" };
    }));
  } finally {
    finishRequest(requestId);
  }
}

export async function compressImages(files) {
  return Promise.all(files.map((file) => imageCompression(file, compressionOptions)));
}
