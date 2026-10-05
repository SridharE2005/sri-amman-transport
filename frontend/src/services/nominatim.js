// src/services/nominatim.js
// OpenStreetMap Nominatim reverse-geocoding service for Admin Dashboard

const cache = new Map();
let lastRequestTime = 0;

/**
 * Calculates approximate distance in meters between two lat/lng points
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Reverse geocodes latitude & longitude into Area, Road, District, State & Postal Code
 * via OpenStreetMap Nominatim.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} fallbackDistrict
 * @returns {Promise<Object>}
 */
export async function reverseGeocodeNominatim(latitude, longitude, fallbackDistrict = "Salem") {
  const lat = Number(latitude);
  const lon = Number(longitude);

  if (isNaN(lat) || isNaN(lon) || lat === 0 || lon === 0) {
    return {
      area: fallbackDistrict || "Salem",
      road: "",
      landmark: "",
      district: `${(fallbackDistrict || "Salem").replace(/\s+district/gi, "").trim()} District`,
      state: "Tamil Nadu",
      postcode: "",
      country: "India",
      stateDisplay: "Tamil Nadu, India",
      fullAddress: `${fallbackDistrict || "Salem"}, Tamil Nadu, India`,
      latitude: null,
      longitude: null,
      source: "Default",
    };
  }

  // Cache lookup using 4-decimal precision (~11 meters)
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // Also check if any existing cached item is within 30 meters
  for (const [key, cachedVal] of cache.entries()) {
    const [cLat, cLon] = key.split(",").map(Number);
    if (!isNaN(cLat) && !isNaN(cLon)) {
      if (getDistanceMeters(lat, lon, cLat, cLon) < 30) {
        return cachedVal;
      }
    }
  }

  // Throttle requests (at least 1100ms between calls to respect OSM policy)
  const now = Date.now();
  const timeSinceLastReq = now - lastRequestTime;
  if (timeSinceLastReq < 1100) {
    await new Promise((resolve) => setTimeout(resolve, 1100 - timeSinceLastReq));
  }
  lastRequestTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SriAmmanTransportAdmin/1.0 (admin@sriamman.com)",
        "Accept-Language": "en",
      },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // 1. Area / Locality / Suburb
      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.subdistrict ||
        addr.village ||
        addr.town ||
        addr.quarter ||
        addr.city_district ||
        "";

      // 2. Road / Street / Flyover
      const road = addr.road || addr.street || addr.pedestrian || addr.highway || "";

      // 3. Landmark / Amenity
      const landmark =
        addr.amenity ||
        addr.shop ||
        addr.building ||
        (data.name && data.name !== road && data.name !== area ? data.name : "");

      // 4. District
      const rawDistrict =
        addr.state_district ||
        addr.county ||
        addr.city_district ||
        addr.city ||
        fallbackDistrict ||
        "Salem";
      const district = `${rawDistrict.replace(/\s+district/gi, "").trim()} District`;

      // 5. State
      const state = addr.state || "Tamil Nadu";

      // 6. Postal Code (PIN)
      const postcode = addr.postcode || "";

      // 7. Country
      const country = addr.country || "India";

      // Composed place
      const placeParts = [];
      if (landmark && landmark !== area && landmark !== road) placeParts.push(landmark);
      if (road && road !== area) placeParts.push(road);
      if (area) placeParts.push(area);
      const place = placeParts.join(", ") || addr.city || area || road || "Current Position";

      const result = {
        success: true,
        source: "OpenStreetMap Nominatim",
        place,
        area: area || road || "Current Location",
        road: road || "",
        landmark: landmark || "",
        district,
        state,
        postcode,
        country,
        stateDisplay: postcode ? `${state} - ${postcode}` : `${state}, ${country}`,
        fullAddress: data.display_name || place,
        latitude: lat,
        longitude: lon,
        updatedAt: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      };

      cache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn("[Admin Nominatim] Geocode lookup error:", err.message);
  }

  // Graceful fallback
  const fallback = {
    success: false,
    source: "Fallback",
    place: fallbackDistrict || "Salem",
    area: fallbackDistrict || "Salem",
    road: "",
    landmark: "",
    district: `${(fallbackDistrict || "Salem").replace(/\s+district/gi, "").trim()} District`,
    state: "Tamil Nadu",
    postcode: "",
    country: "India",
    stateDisplay: "Tamil Nadu, India",
    fullAddress: `${fallbackDistrict || "Salem"}, Tamil Nadu, India`,
    latitude: lat,
    longitude: lon,
    updatedAt: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }),
  };

  cache.set(cacheKey, fallback);
  return fallback;
}
