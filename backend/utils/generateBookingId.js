// utils/generateBookingId.js
import crypto from "crypto";
import Booking from "../models/Booking.js";

// Uppercase letters and digits, excluding confusing characters: 0, O, 1, I
const ALLOWED_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Format date to YYYYMMDD string
 * @param {Date|string|number} date
 * @returns {string}
 */
export const formatDateYYYYMMDD = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
};

/**
 * Generates raw booking ID in the format: SAT + YYYYMMDD + 6 random chars
 * @param {Date|string|number} date
 * @returns {string}
 */
export const generateRawBookingId = (date = new Date()) => {
  const dateStr = formatDateYYYYMMDD(date);
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, ALLOWED_CHARS.length);
    randomPart += ALLOWED_CHARS[randomIndex];
  }
  return `SAT${dateStr}${randomPart}`;
};

/**
 * Generates a unique booking ID by checking against existing bookings in MongoDB
 * Retries if a collision is found.
 * @param {Date|string|number} date
 * @param {number} maxAttempts
 * @returns {Promise<string>}
 */
export const generateUniqueBookingId = async (date = new Date(), maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidateId = generateRawBookingId(date);
    const existing = await Booking.exists({ bookingId: candidateId });
    if (!existing) {
      return candidateId;
    }
  }
  throw new Error("Unable to generate a unique bookingId after maximum attempts.");
};
