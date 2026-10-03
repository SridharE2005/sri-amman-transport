// src/pages/Stocks.jsx
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import API from "../services/api";
import { FiClock, FiPhone, FiMapPin, FiSearch, FiNavigation, FiUser, FiTruck } from "react-icons/fi";
import { AvailableGoodsSkeleton } from "../components/AdminSkeletons";

const MATERIAL_ICON = { Bricks: "🧱", "M-Sand": "⛏️", "Dry Grass Rolls": "🌾", "River Sand": "🏖️" };

const materialGradient = {
  Bricks:           "from-orange-600/80 to-red-700/80",
  "M-Sand":         "from-yellow-600/80 to-amber-700/80",
  "Dry Grass Rolls":"from-green-600/80  to-emerald-700/80",
  "River Sand":     "from-blue-600/80   to-cyan-700/80",
};
const materialAccent = {
  Bricks:           "text-orange-400",
  "M-Sand":         "text-amber-400",
  "Dry Grass Rolls":"text-emerald-400",
  "River Sand":     "text-cyan-400",
};
const statusColor = {
  Available: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Limited:   "bg-amber-500/20  text-amber-400  border-amber-500/30",
  Full:      "bg-red-500/20    text-red-400    border-red-500/30",
};

const getPrice = (s) => {
  if (s.material === "Bricks")          return `₹${s.pricePerBrick}/brick`;
  if (s.material === "M-Sand" || s.material === "River Sand") return `₹${s.pricePerUnit}/unit`;
  if (s.material === "Dry Grass Rolls") return `₹${s.pricePerRoll}/roll`;
  return "";
};
const getQuantityText = (s) => {
  if (s.material === "Bricks") return `${s.howManyBricks} bricks`;
  if (s.material === "Dry Grass Rolls") return `${s.noOfRolls} rolls`;
  return `${s.units} units`;
};
const getBookingDetails = (s) => {
  if (s.material === "Bricks") return [s.location, s.brickType, getQuantityText(s)];
  if (s.material === "M-Sand" || s.material === "River Sand") return [getQuantityText(s)];
  if (s.material === "Dry Grass Rolls") return [getQuantityText(s)];
  return [];
};
const getImages = (s) => {
  const savedImages = Array.isArray(s.image) && s.image.length
    ? s.image.map((image) => typeof image === "string" ? image : image.url).filter(Boolean)
    : Array.isArray(s.images) && s.images.length ? s.images : s.image ? [s.image] : [];
  return savedImages;
};

const qtyLabel       = (m) => m === "Bricks" ? "How Many Bricks?" : m === "Dry Grass Rolls" ? "How Many Rolls?" : "How Many Units?";
const qtyPlaceholder = (m) => m === "Bricks" ? "e.g. 2000" : m === "Dry Grass Rolls" ? "e.g. 20" : "e.g. 50";
const FORM_INIT = { customerName: "", customerEmail: "", customerPhone: "", orderQty: "", villageCity: "", district: "", pincode: "" };

const DEFAULT_MAP_CENTER = [11.6643, 78.1460];

const uniqueAddressParts = (parts) => [...new Set(parts.filter(Boolean).map((part) => part.trim()).filter(Boolean))];

const getAddressParts = (address) => {
  const locality = uniqueAddressParts([
    address.house_number,
    address.road,
    address.village,
    address.hamlet,
    address.suburb,
    address.neighbourhood,
    address.town,
    address.city,
    address.municipality,
  ]);
  const district = address.district || address.state_district || address.county || address.city_district || address.state;
  return { city: locality.join(", "), district, pincode: (address.postcode || "").replace(/\D/g, "").slice(0, 6) };
};

const reverseGeocode = async (lat, lng, zoom) => {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=${zoom}&addressdetails=1&accept-language=en&lat=${lat}&lon=${lng}`);
  if (!response.ok) throw new Error("Location lookup failed");
  return response.json();
};

function MapClickHandler({ onSelect }) {
  useMapEvents({ click: (event) => onSelect(event.latlng) });
  return null;
}

function MapCenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.6 });
  }, [map, position]);
  return null;
}

function LocationPicker({ onClose, onAddressSelected }) {
  const { tr } = useTheme();
  const [position, setPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(false);
  const [lookup, setLookup] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  const handleClose = () => {
    onClose();
  };

  const selectLocation = async ({ lat, lng }, locationMetadata = {}) => {
    setPosition([lat, lng]);
    setAccuracy(locationMetadata.accuracy || null);
    setSelectedAddress(false);
    setLookup(true);
    setLookupError("");
    try {
      const data = await reverseGeocode(lat, lng, 18);
      const exactAddress = data.address || {};
      if (locationMetadata.useNearbyMainLocation) {
        console.log("Current location address:", data.display_name || exactAddress);
      }
      let { city, district, pincode } = getAddressParts(exactAddress);

      if (locationMetadata.useNearbyMainLocation) {
        const nearbyData = await reverseGeocode(lat, lng, 10);
        const nearbyAddress = nearbyData.address || {};
        const nearby = getAddressParts(nearbyAddress);
        city = nearby.city || city;
        district = nearby.district || district;
        pincode = pincode || nearby.pincode;
      }

      if (!city || !district) throw new Error(tr("A complete address was not found here"));
      onAddressSelected({ city, district, pincode });
      setSelectedAddress(true);
      if (!pincode) setLookupError("No pincode was found. Please enter it manually below.");
    } catch (error) {
      setLookupError(tr(error.message || "Could not find the address. Try another point."));
    } finally {
      setLookup(false);
    }
  };

  const searchLocation = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!searchText.trim()) return;
    setLookup(true);
    setLookupError("");
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=${encodeURIComponent(searchText.trim())}`);
      if (!response.ok) throw new Error("Location search failed");
      const results = await response.json();
      const result = results.find((item) => item.address?.village || item.address?.town || item.address?.city) || results[0];
      if (!result) throw new Error("No matching location found");
      await selectLocation({ lat: Number(result.lat), lng: Number(result.lon) });
    } catch (error) {
      setLookupError(tr(error.message || "Could not find that location."));
      setLookup(false);
    }
  };

  const useCurrentLocation = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!navigator.geolocation) {
      setLookupError("Location access is not supported by this browser.");
      return;
    }
    setLookup(true);
    setLookupError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        console.log("Current location from Browser Geolocation API:", {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          timestamp: new Date(timestamp).toISOString(),
        });
        selectLocation({ lat: coords.latitude, lng: coords.longitude }, { accuracy: coords.accuracy, useNearbyMainLocation: true });
      },
      () => {
        setLookup(false);
        setLookupError(tr("Could not access your location. Allow location permission and try again."));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-picker-title"
      onClick={(event) => {
        event.stopPropagation();
        if (event.target === event.currentTarget) handleClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(5px)" }}
    >
      <div
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
          <div>
            <h3 id="location-picker-title" className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{tr("Choose delivery location")}</h3>
            <p className="mt-1 text-xs" style={{ color: "var(--text3)" }}>{tr("Click the map to select the delivery point.")}</p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            aria-label="Close map"
            className="w-9 h-9 rounded-full border text-lg flex items-center justify-center cursor-pointer transition hover:bg-black/10 dark:hover:bg-white/10"
            style={{ color: "var(--text2)", borderColor: "var(--border)" }}
          >
            ✕
          </button>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row sm:px-5">
          <form onSubmit={searchLocation} className="flex min-w-0 flex-1 gap-2" onClick={(e) => e.stopPropagation()}>
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder={tr("Search village, city or place")} aria-label={tr("Search for a location")} className="input !mb-0 min-w-0 flex-1" />
            <button type="submit" disabled={lookup || !searchText.trim()} aria-label="Search location" className="flex w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-40 cursor-pointer"><FiSearch /></button>
          </form>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={lookup}
            className="flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold text-blue-500 disabled:opacity-40 cursor-pointer hover:bg-blue-500/10 transition"
            style={{ borderColor: "rgba(59,130,246,0.35)" }}
          >
            <FiNavigation /> {tr("Use current location")}
          </button>
        </div>
        <div className="h-[48dvh] min-h-[240px] sm:h-[52vh]">
          <MapContainer center={DEFAULT_MAP_CENTER} zoom={9} className="h-full w-full" scrollWheelZoom>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler onSelect={selectLocation} />
            <MapCenter position={position} />
            {position && <CircleMarker center={position} radius={10} pathOptions={{ color: "#2563eb", fillColor: "#60a5fa", fillOpacity: 0.85 }} />}
          </MapContainer>
        </div>
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="min-w-0 text-xs" style={{ color: lookupError ? "#f59e0b" : "var(--text3)" }}>{lookup ? "Finding exact address…" : lookupError || (position ? `Location selected${accuracy ? ` (GPS accuracy about ${Math.round(accuracy)}m)` : ""}. Review the address fields after closing.` : "No location selected")}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            disabled={!selectedAddress || lookup}
            className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40 cursor-pointer hover:bg-blue-700 transition"
          >
            {tr("Use this location")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const getUnitPrice = (goods) => {
  if (goods.material === "Bricks") return Number(goods.pricePerBrick) || 0;
  if (goods.material === "M-Sand" || goods.material === "River Sand") return Number(goods.pricePerUnit) || 0;
  if (goods.material === "Dry Grass Rolls") return Number(goods.pricePerRoll) || 0;
  return 0;
};

/* ── Booking Modal ── */
function BookingModal({ goods, onClose, onSuccess }) {
  const { tr } = useTheme();
  const { user } = useUser();
  const [form, setForm] = useState(() => ({
    customerName: [user?.firstName, user?.lastName].filter(Boolean).join(" "),
    customerEmail: user?.email || "",
    customerPhone: "",
    orderQty: "",
    villageCity: "",
    district: "",
    pincode: "",
  }));
  const [saving, setSaving] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const images = getImages(goods);
  const [activeImage, setActiveImage] = useState(0);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const mapOpenRef = useRef(mapOpen);
  mapOpenRef.current = mapOpen;

  const handleClose = () => {
    if (mapOpenRef.current) {
      setMapOpen(false);
      return;
    }
    onClose();
    if (window.history.state?.goodsBookingModal) {
      window.history.back();
    }
  };

  useEffect(() => {
    window.history.pushState({ goodsBookingModal: true }, "");
    const handlePopState = () => {
      // If LocationPicker is currently open, close map only and restore modal state
      if (mapOpenRef.current) {
        setMapOpen(false);
        window.history.pushState({ goodsBookingModal: true }, "");
        return;
      }
      onCloseRef.current();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || [user.firstName, user.lastName].filter(Boolean).join(" "),
        customerEmail: prev.customerEmail || user.email || "",
      }));
    }
  }, [user]);

  const set = (k) => (e) => {
    const value = k === "customerPhone" || k === "orderQty" || k === "pincode"
      ? e.target.value.replace(/\D/g, "")
      : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
  };

  const availableQty = (() => {
    if (goods.material === "Bricks") return Number(goods.howManyBricks) || 0;
    if (goods.material === "M-Sand" || goods.material === "River Sand") return Number(goods.units) || 0;
    if (goods.material === "Dry Grass Rolls") return Number(goods.noOfRolls) || 0;
    return 0;
  })();
  const estimatedAmount = (Number(form.orderQty) || 0) * getUnitPrice(goods);

  const handleSubmit = async () => {
    if (user?.role === "admin") {
      toast.info(tr("Admins cannot place bookings. View and inspect only."));
      return;
    }
    const { customerName, customerEmail, customerPhone, orderQty, villageCity, district, pincode } = form;
    if (!customerName || !customerEmail || !customerPhone || !orderQty || !villageCity || !district || !pincode) {
      toast.error(tr("Please fill all fields")); return;
    }
    if (!/^\d{10}$/.test(customerPhone)) {
      toast.error(tr("Phone number must contain exactly 10 digits")); return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      toast.error(tr("Pincode must contain exactly 6 digits")); return;
    }
    if (!/^\d+$/.test(orderQty)) {
      toast.error(tr("Quantity must contain numbers only")); return;
    }

    const qty = Number(orderQty);
    if (!Number.isSafeInteger(qty) || qty <= 0) {
      toast.error(tr("Enter a valid quantity")); return;
    }
    if (qty > availableQty) {
      toast.error(`${tr("Only")} ${availableQty} ${tr(goods.material === "Bricks" ? "bricks" : goods.material === "Dry Grass Rolls" ? "rolls" : "units")} ${tr("available")}`);
      return;
    }

    setSaving(true);
    try {
      await API.post("/bookings", {
        goodsId: goods._id, customerName, customerEmail,
        customerPhone, orderQty: qty,
        deliveryAddress: `${villageCity.trim()}, ${district.trim()} - ${pincode}`,
      });
      toast.success(`Booking placed for ${goods.material}! Awaiting admin confirmation.`);
      if (window.history.state?.goodsBookingModal) {
        window.history.replaceState(null, "");
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally { setSaving(false); }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start lg:items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
        onClick={handleClose}>
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl my-2 sm:my-4"
        style={{ background: "var(--card, var(--bg3))", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="grid lg:grid-cols-2">
          <div className="p-4 sm:p-7" style={{ background: "var(--bg2)" }}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                style={{ color: "var(--text2)", borderColor: "var(--border)" }}
              >
                <span>←</span> <span>{tr("Back to Stocks")}</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold transition hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                style={{ color: "var(--text2)", borderColor: "var(--border)" }}
              >
                ✕
              </button>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
              <img src={images[activeImage]} alt={goods.material} className="w-full h-full object-contain bg-black/10" />
              {images.length > 1 && <>
                <button onClick={() => setActiveImage((activeImage - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 text-white">‹</button>
                <button onClick={() => setActiveImage((activeImage + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 text-white">›</button>
              </>}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {images.map((image, index) => <button key={`${image}-${index}`} onClick={() => setActiveImage(index)} className={`aspect-square rounded-xl overflow-hidden border-2 ${activeImage === index ? "border-blue-500" : "border-transparent"}`}><img src={image} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" /></button>)}
            </div>
          </div>

          <div className="p-4 sm:p-7 lg:max-h-[80vh] lg:overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div><p className="text-sm font-semibold" style={{ color: "var(--text3)" }}>{MATERIAL_ICON[goods.material]} {goods.material}</p><h2 className="text-2xl font-extrabold mt-1" style={{ color: "var(--text)" }}>{goods.title || "Material booking"}</h2></div>
              <div className="flex items-start gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor[goods.status]}`}>{goods.status}</span>
                <button onClick={handleClose} aria-label="Close booking" className="w-9 h-9 -mt-1 rounded-full border text-lg cursor-pointer" style={{ color: "var(--text2)", borderColor: "var(--border)" }}>✕</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {getBookingDetails(goods).filter(Boolean).map((detail) => <div key={detail} className="p-3 rounded-xl" style={{ background: "var(--surface)", color: "var(--text2)" }}><p className="text-xs">{detail}</p></div>)}
            </div>
            <p className={`text-2xl font-extrabold mb-6 ${materialAccent[goods.material]}`}>{getPrice(goods)}</p>
            {goods.assignedDriver && (
              <div
                className="rounded-2xl p-4 sm:p-5 mb-6"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                }}
              >
                {/* Header label */}
                <div
                  className="flex items-center justify-between gap-2 pb-3 mb-3 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: "var(--text3)" }}
                  >
                    <FiUser className="text-blue-500 text-sm" /> Assigned Driver
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    Verified Driver
                  </span>
                </div>

                {/* 1. Top: Driver Name with Avatar */}
                <div className="flex items-center gap-3.5 mb-3.5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                    {goods.assignedDriver.profileImage ? (
                      <img
                        src={goods.assignedDriver.profileImage}
                        alt={goods.assignedDriver.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      goods.assignedDriver.name?.[0] || "D"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium" style={{ color: "var(--text3)" }}>Driver Name</p>
                    <h4
                      className="font-extrabold text-lg sm:text-xl leading-tight break-words"
                      style={{ color: "var(--text)" }}
                    >
                      {goods.assignedDriver.name}
                    </h4>
                  </div>
                </div>

                {/* Driver Details List: Vehicle Type -> Phone Number -> Experience */}
                <div className="space-y-2.5">
                  {/* 2. Vehicle Type */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center flex-shrink-0 text-base">
                      <FiTruck />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                        Vehicle Type
                      </p>
                      <p className="text-sm font-semibold break-words leading-tight" style={{ color: "var(--text)" }}>
                        {goods.assignedDriver.vehicle || "Transport Vehicle"}
                      </p>
                    </div>
                  </div>

                  {/* 3. Phone Number */}
                  <div
                    className="flex items-center justify-between gap-3 p-3 rounded-xl"
                    style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 text-base">
                        <FiPhone />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                          Phone Number
                        </p>
                        <p className="text-sm font-semibold break-all leading-tight" style={{ color: "var(--text)" }}>
                          {goods.assignedDriver.phone}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${goods.assignedDriver.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                    >
                      <FiPhone className="text-xs" /> Call
                    </a>
                  </div>

                  {/* 4. Experience */}
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0 text-base">
                      <FiClock />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                        Experience
                      </p>
                      <p className="text-sm font-semibold break-words leading-tight" style={{ color: "var(--text)" }}>
                        {goods.assignedDriver.experience ? `${goods.assignedDriver.experience}` : "Experienced"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Name with Initial</label>
            <input className="input !mb-0" placeholder="e.g. S. Ramesh" value={form.customerName} onChange={set("customerName")} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Email ID</label>
            <input className="input !mb-0" type="email" placeholder="e.g. ramesh@email.com" value={form.customerEmail} onChange={set("customerEmail")} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Phone Number</label>
            <input className="input !mb-0" type="text" inputMode="numeric" pattern="[0-9]{10}" placeholder="e.g. 9842100000" maxLength={10} value={form.customerPhone} onChange={set("customerPhone")} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: "var(--text3)" }}>{qtyLabel(goods.material)}</label>
            <input className="input !mb-0" type="text" inputMode="numeric" pattern="[0-9]*" minLength={1} placeholder={qtyPlaceholder(goods.material)} value={form.orderQty} onChange={set("orderQty")} />
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border px-4 py-3" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "rgba(16, 185, 129, 0.28)" }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>Available now</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {availableQty} <span className="text-sm font-bold">{goods.material === "Bricks" ? "bricks" : goods.material === "Dry Grass Rolls" ? "rolls" : "units"}</span>
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span className="text-xs font-semibold" style={{ color: "var(--text3)" }}>Estimated total</span>
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹{estimatedAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              {tr("Delivery Address")}
            </label>

            {/* Full-width prominent Choose Location Button */}
            <button
              type="button"
              onClick={() => setMapOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 shadow-blue-500/25"
            >
              <FiMapPin className="text-lg flex-shrink-0" />
              <span>{tr("Choose Location on Map")}</span>
              {Boolean(form.villageCity || form.district) && (
                <span className="ml-1 text-[11px] px-2.5 py-0.5 rounded-full bg-white/20 text-white font-medium">
                  {tr("Location Set")}
                </span>
              )}
            </button>

            {/* OR Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t" style={{ borderColor: "var(--border)" }} />
              <span
                className="absolute px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full border shadow-sm"
                style={{
                  background: "var(--surface, var(--card))",
                  borderColor: "var(--border)",
                  color: "var(--text3)",
                }}
              >
                {tr("OR")}
              </span>
            </div>

            {/* Manual input fields */}
            <div className="space-y-2">
              <input
                className="input !mb-0"
                type="text"
                placeholder={tr("Village or city name")}
                value={form.villageCity}
                onChange={set("villageCity")}
              />
              <input
                className="input !mb-0"
                type="text"
                placeholder={tr("District name")}
                value={form.district}
                onChange={set("district")}
              />
              <input
                className="input !mb-0"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder={tr("Pincode (6 digits)")}
                value={form.pincode}
                onChange={set("pincode")}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--text3)" }}>
              {tr("Saved as: Village/City, District - Pincode")}
            </p>
          </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-5 sm:px-7 pb-5 sm:pb-7 lg:justify-end" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition hover:bg-white/5 cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text2)" }}>
            {user?.role === "admin" ? "Close" : "Cancel"}
          </button>
          {user?.role === "admin" ? (
            <button
              disabled
              title="Admins cannot book goods"
              className="flex-1 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-semibold cursor-not-allowed opacity-80"
            >
              Admin View Only (Booking Disabled)
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-500/20">
              {saving ? "Placing…" : "Confirm Booking"}
            </button>
          )}
        </div>
      </div>
    </div>
    {mapOpen && <LocationPicker onClose={() => setMapOpen(false)} onAddressSelected={({ city, district, pincode }) => setForm((current) => ({ ...current, villageCity: city, district, pincode }))} />}
  </>
  );
}

/* ── Goods Card ── */
function GoodsCard({ s, onBook, t, user }) {
  const images = getImages(s);
  const [imageIndex] = useState(0);
  const isAdmin = user?.role === "admin";

  return (
    <button
      onClick={() => onBook(s)}
      disabled={!isAdmin && s.status === "Full"}
      className="text-left rounded-2xl overflow-hidden flex flex-col transition hover:-translate-y-1 hover:shadow-2xl disabled:cursor-not-allowed cursor-pointer"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(0,0,0,0.18)" }}
    >

      {/* Photo */}
      <div className="relative h-44 overflow-hidden">
        <img src={images[imageIndex]} alt={s.material} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        <div className={`absolute inset-0 bg-gradient-to-t opacity-60 ${materialGradient[s.material]}`} />
        {images.length > 1 && <div className="absolute bottom-3 right-3 flex gap-1">{images.map((image, index) => <span key={`${image}-${index}`} className={`w-1.5 h-1.5 rounded-full ${index === imageIndex ? "bg-white" : "bg-white/40"}`} />)}</div>}

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${statusColor[s.status]}`}>{s.status}</span>
        </div>

      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-extrabold text-base leading-tight" style={{ color: "var(--text)" }}>{s.title || s.material}</h3>
          <p className="text-xs mt-1 font-semibold" style={{ color: "var(--text3)" }}>{s.material}</p>
        </div>

        <div className="space-y-1.5 text-sm" style={{ color: "var(--text2)" }}>
          <p><span className="font-semibold" style={{ color: "var(--text)" }}>Quantity:</span> {getQuantityText(s)}</p>
          {s.material === "Bricks" && <p><span className="font-semibold" style={{ color: "var(--text)" }}>Brick type:</span> {s.brickType || "—"}</p>}
          {(s.material === "Bricks" || s.material === "M-Sand" || s.material === "River Sand") && s.location && (
            <p className="truncate"><span className="font-semibold" style={{ color: "var(--text)" }}>Location:</span> {s.location}</p>
          )}
        </div>

        {/* Price + availability */}
        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div>
            <p className={`text-lg font-extrabold ${materialAccent[s.material]}`}>{getPrice(s)}</p>
            <p className="text-xs" style={{ color: "var(--text3)" }}>Available stock</p>
          </div>
          <span
            className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
              isAdmin
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30"
                : s.status === "Full"
                ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white opacity-30"
                : "bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:opacity-90 shadow-blue-500/20"
            }`}
          >
            {isAdmin ? "Inspect & View" : s.status === "Full" ? t.fullLabel : t.book}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Main Page ── */
export default function Stocks() {
  const { user, loading } = useUser();
  const { t, lang, tr }   = useTheme();
  const nav               = useNavigate();

  const [goods,      setGoods]      = useState([]);
  const [fetching,   setFetching]   = useState(true);
  const [modalGoods, setModalGoods] = useState(null);
  const [filter,     setFilter]     = useState("All");

  useEffect(() => {
    if (!loading && !user) {
      toast.error(lang === "ta" ? "பங்கு பார்க்க உள்நுழையவும்" : "Please login to view available stocks");
      nav("/login");
    }
  }, [user, loading, nav, lang]);

  useEffect(() => {
    if (!user) return;
    API.get("/goods")
      .then(({ data }) => setGoods(data.filter((item) => item.status !== "Full")))
      .catch(() => toast.error("Failed to load goods"))
      .finally(() => setFetching(false));
  }, [user]);

  const handleBookSuccess = () => {
    setModalGoods(null);
    API.get("/goods").then(({ data }) => setGoods(data.filter((item) => item.status !== "Full")));
  };

  if (loading || !user) return null;

  const FILTERS = ["All", ...Object.keys(MATERIAL_ICON)];
  const filtered = filter === "All" ? goods : goods.filter((g) => g.material === filter);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--blob1)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--blob2)" }} />
      </div>

      <Navbar />

      {modalGoods && (
        <BookingModal goods={modalGoods} onClose={() => setModalGoods(null)} onSuccess={handleBookSuccess} />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Header */}
        <div className="mb-8">
          <span className="section-tag">{t.stocksTag}</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: "var(--text)" }}>{t.stocksTitle}</h1>
          <p className="text-sm" style={{ color: "var(--text3)" }}>
            {t.stocksWelcome} <span className="text-blue-500 font-semibold">{user.firstName}</span>. {t.stocksDesc}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${filter === f ? "bg-blue-500/15 text-blue-400 border-blue-500/30" : "hover:bg-white/5"}`}
              style={filter !== f ? { borderColor: "var(--border)", color: "var(--text2)" } : {}}>
              {f !== "All" && <span className="mr-1">{MATERIAL_ICON[f]}</span>}{f}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {fetching ? (
          <AvailableGoodsSkeleton />
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl mb-4">📦</p>
            <p className="font-semibold text-lg" style={{ color: "var(--text2)" }}>No goods available right now</p>
            <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>Check back soon or contact us</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((s) => (
              <GoodsCard key={s._id} s={s} onBook={setModalGoods} t={t} user={user} />
            ))}
          </div>
        )}

        <p className="text-xs text-center mt-8" style={{ color: "var(--text3)" }}>{t.stockNote}</p>
      </div>
    </div>
  );
}
