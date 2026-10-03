import "dotenv/config";

const DEFAULT_PREFIX = "transport-goods-defaults";

const DEFAULT_IMAGES = {
  Bricks: { publicId: `${DEFAULT_PREFIX}/bricks`, url: process.env.DEFAULT_BRICKS_IMAGE_URL || "" },
  "M-Sand": { publicId: `${DEFAULT_PREFIX}/m-sand`, url: process.env.DEFAULT_MSAND_IMAGE_URL || "" },
  "River Sand": { publicId: `${DEFAULT_PREFIX}/river-sand`, url: process.env.DEFAULT_RIVER_SAND_IMAGE_URL || "" },
  "Dry Grass Rolls": { publicId: `${DEFAULT_PREFIX}/dry-grass-rolls`, url: process.env.DEFAULT_DRY_GRASS_IMAGE_URL || "" },
};

export const getDefaultImage = (material) => {
  const image = DEFAULT_IMAGES[material];
  if (!image?.url) throw new Error(`Default Cloudinary image is not configured for ${material}`);
  return { ...image };
};

export const isDefaultImage = (image) => {
  const publicId = typeof image === "string" ? image : image?.publicId || image?.url || "";
  return publicId === DEFAULT_PREFIX
    || publicId.startsWith(`${DEFAULT_PREFIX}/`)
    || publicId.includes(`/${DEFAULT_PREFIX}/`);
};

export const getDefaultImageConfig = () => DEFAULT_IMAGES;