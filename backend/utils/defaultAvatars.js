// backend/utils/defaultAvatars.js

export const DEFAULT_AVATARS = [
  { id: "cartoon_lion", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677962/transport-goods-defaults/avatars/cartoon_lion.png" },
  { id: "cartoon_tiger", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677964/transport-goods-defaults/avatars/cartoon_tiger.png" },
  { id: "cartoon_panda", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677965/transport-goods-defaults/avatars/cartoon_panda.png" },
  { id: "cartoon_elephant", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677966/transport-goods-defaults/avatars/cartoon_elephant.png" },
  { id: "cartoon_fox", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677968/transport-goods-defaults/avatars/cartoon_fox.png" },
  { id: "cartoon_bear", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677969/transport-goods-defaults/avatars/cartoon_bear.png" },
  { id: "cartoon_wolf", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677970/transport-goods-defaults/avatars/cartoon_wolf.png" },
  { id: "cartoon_monkey", url: "https://res.cloudinary.com/inboissa/image/upload/v1790677972/transport-goods-defaults/avatars/cartoon_monkey.png" },
];

export const isDefaultAvatar = (url) => {
  if (!url) return false;
  return DEFAULT_AVATARS.some((avatar) => avatar.url === url) || url.includes("transport-goods-defaults/avatars");
};
