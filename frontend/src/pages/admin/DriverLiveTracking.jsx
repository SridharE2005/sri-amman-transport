// src/pages/admin/DriverLiveTracking.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "react-toastify";
import API from "../../services/api";
import { getSocket } from "../../services/socket";
import { reverseGeocodeNominatim } from "../../services/nominatim";
import { useTheme } from "../../context/ThemeContext";
import {
  FiArrowLeft,
  FiClock,
  FiCompass,
  FiMaximize2,
  FiMapPin,
  FiNavigation,
  FiRadio,
  FiRefreshCw,
  FiShield,
  FiTruck,
  FiUser,
  FiZap,
} from "react-icons/fi";

// Default Tamil Nadu district coordinates for fallback/centering
const DISTRICT_COORDS = {
  Salem: [11.6643, 78.1460],
  Namakkal: [11.2189, 78.1674],
  Erode: [11.3410, 77.7172],
  Coimbatore: [11.0168, 76.9558],
  Dharmapuri: [12.1211, 78.1582],
  Tirupur: [11.1085, 77.3411],
  Karur: [10.9601, 78.0766],
  Trichy: [10.7905, 78.7047],
};

export default function DriverLiveTracking() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { tr, theme } = useTheme();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Live telemetry state
  const [telemetry, setTelemetry] = useState({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    lastUpdated: null,
    isOnline: false,
  });

  // Nominatim reverse-geocoded detailed location
  const [nominatimLocation, setNominatimLocation] = useState({
    place: "Locating position…",
    area: "Acquiring area…",
    road: "",
    landmark: "",
    district: "Salem District",
    state: "Tamil Nadu",
    postcode: "",
    country: "India",
    fullAddress: "Acquiring real-time address…",
    updatedAt: "",
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Relative time tracker ("Just now", "2 minutes ago")
  const [relativeTimeStr, setRelativeTimeStr] = useState("Just now");

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentCoordsRef = useRef(null);
  const driverRef = useRef(null);

  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);

  // 1. Fetch initial driver state on mount / refresh
  const fetchDriverData = useCallback(async (isManual = false) => {
    try {
      if (isManual || !driverRef.current) {
        setLoading(true);
      }
      const { data } = await API.get(`/drivers/${driverId}`);
      setDriver(data);
      driverRef.current = data;

      const tracking = data.tracking || {};
      const lastLoc = data.lastLocation || {};

      const lat = tracking.latitude || lastLoc.latitude || null;
      const lng = tracking.longitude || lastLoc.longitude || null;

      const initialTelemetry = {
        latitude: lat,
        longitude: lng,
        accuracy: tracking.accuracy || lastLoc.accuracy || null,
        speed: tracking.speed !== undefined ? tracking.speed : (lastLoc.speed !== undefined ? lastLoc.speed : null),
        heading: tracking.heading !== undefined ? tracking.heading : (lastLoc.heading !== undefined ? lastLoc.heading : null),
        lastUpdated: tracking.lastUpdated || lastLoc.updatedAt || data.checkedInAt || null,
        isOnline: Boolean(data.isOnline || (data.isCheckedIn && tracking.isOnline)),
      };

      setTelemetry(initialTelemetry);

      // Check if geocoded fields already exist from database
      if (tracking.area || lastLoc.area) {
        setNominatimLocation({
          place: tracking.area || lastLoc.area,
          area: tracking.area || lastLoc.area,
          road: tracking.road || lastLoc.road || "",
          landmark: "",
          district: tracking.district || lastLoc.district || `${data.district || "Salem"} District`,
          state: tracking.state || lastLoc.state || "Tamil Nadu",
          postcode: tracking.postcode || lastLoc.postcode || "",
          fullAddress: tracking.fullAddress || lastLoc.fullAddress || "",
          updatedAt: tracking.lastUpdated ? new Date(tracking.lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "",
        });
      } else if (lat && lng) {
        setIsGeocoding(true);
        reverseGeocodeNominatim(lat, lng, data.district || "Salem")
          .then((resolved) => {
            if (resolved) setNominatimLocation(resolved);
          })
          .finally(() => setIsGeocoding(false));
      }

      if (lat && lng) {
        currentCoordsRef.current = { lat, lng };
        if (mapInstanceRef.current && markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.panTo([lat, lng], { animate: true });
        }
      }
    } catch (err) {
      console.error("[LiveTracking] Error loading driver:", err);
      toast.error(tr("Could not load driver details"));
    } finally {
      setLoading(false);
    }
  }, [driverId, tr]);

  useEffect(() => {
    if (driverId) {
      fetchDriverData();
    }
  }, [driverId, fetchDriverData]);

  // Helper to create rotated custom Driver Profile Leaflet Icon (TASK 5)
  const createTruckIcon = useCallback((heading = 0, isOnline = true, name = "Driver", profileImage = null) => {
    const primaryColor = isOnline ? "#10B981" : "#EF4444";
    const rotation = typeof heading === "number" && !isNaN(heading) ? heading : 0;
    const initial = (name && name[0]) ? name[0].toUpperCase() : "D";

    const avatarHtml = profileImage
      ? `<img src="${profileImage}" alt="${name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: #6366F1; color: #FFFFFF; font-weight: 900; font-size: 16px; border-radius: 50%;">${initial}</div>`
      : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #6366F1; color: #FFFFFF; font-weight: 900; font-size: 16px; border-radius: 50%;">${initial}</div>`;

    const html = `
      <div style="position: relative; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing Radar Glow Ring -->
        <div style="position: absolute; width: 52px; height: 52px; border-radius: 50%; background: ${primaryColor}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Rotating Direction Pointer -->
        <div style="position: absolute; width: 56px; height: 56px; transform: rotate(${rotation}deg); transition: transform 0.4s ease; display: flex; align-items: center; justify-content: center; pointer-events: none;">
          <div style="position: absolute; top: -3px; width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 9px solid ${primaryColor}; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));"></div>
        </div>

        <!-- Driver Profile Picture Container -->
        <div style="position: relative; width: 44px; height: 44px; border-radius: 50%; border: 3px solid ${primaryColor}; background: #0F172A; box-shadow: 0 4px 12px rgba(0,0,0,0.35); overflow: hidden; display: flex; align-items: center; justify-content: center; z-index: 5;">
          ${avatarHtml}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: "driver-profile-leaflet-marker",
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    });
  }, []);

  // Smooth Marker Animation (TASK 5)
  const animateMarker = useCallback((targetLat, targetLng, heading, isOnline) => {
    if (!markerInstanceRef.current || !mapInstanceRef.current) return;

    const fromLat = currentCoordsRef.current?.lat || targetLat;
    const fromLng = currentCoordsRef.current?.lng || targetLng;

    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth interpolation

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuad(progress);

      const lat = fromLat + (targetLat - fromLat) * eased;
      const lng = fromLng + (targetLng - fromLng) * eased;

      markerInstanceRef.current.setLatLng([lat, lng]);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        currentCoordsRef.current = { lat: targetLat, lng: targetLng };
        // Pan map smoothly to stay centered on driver
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([targetLat, targetLng], { animate: true, duration: 0.8 });
        }
      }
    };

    // Update rotated icon with latest heading and status
    const curDriver = driverRef.current;
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setIcon(
        createTruckIcon(heading || 0, isOnline, curDriver?.name || "Driver", curDriver?.profileImage)
      );
    }
    animationFrameRef.current = requestAnimationFrame(step);
  }, [createTruckIcon]);

  // 2. Initialize Leaflet Map ONCE on mount (NEVER recreate on 5s telemetry updates!)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Keep loaded, do not re-initialize on every render!

    const curDriver = driverRef.current;
    const defaultCoords = (currentCoordsRef.current?.lat && currentCoordsRef.current?.lng)
      ? [currentCoordsRef.current.lat, currentCoordsRef.current.lng]
      : (DISTRICT_COORDS[curDriver?.district] || DISTRICT_COORDS.Salem);

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: defaultCoords,
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    // High-reliability official OpenStreetMap tiles (100% free, NO API key required)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Initial Truck Marker
    const marker = L.marker(defaultCoords, {
      icon: createTruckIcon(0, true, curDriver?.name || "Driver", curDriver?.profileImage),
    }).addTo(map);

    // Popup Info
    marker.bindPopup(`
      <div style="font-family: system-ui; text-align: center; padding: 4px;">
        <strong style="color: #0f172a; font-size: 13px;">${curDriver?.name || "Driver"}</strong>
        <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${curDriver?.vehicleNumber || "Lorry"}</div>
        <div style="color: #10b981; font-size: 11px; font-weight: 700; margin-top: 2px;">Live Location</div>
      </div>
    `);

    mapInstanceRef.current = map;
    markerInstanceRef.current = marker;
    setMapReady(true);

    // Invalidate size after layout settles to guarantee tiles fill map container
    const resizeTimer = setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, [createTruckIcon]); // Map runs once, permanently mounted!

  // Update marker icon and popup when driver info finishes loading
  useEffect(() => {
    if (markerInstanceRef.current && driver) {
      markerInstanceRef.current.setIcon(
        createTruckIcon(telemetry.heading || 0, telemetry.isOnline, driver.name, driver.profileImage)
      );
      markerInstanceRef.current.setPopupContent(`
        <div style="font-family: system-ui; text-align: center; padding: 4px;">
          <strong style="color: #0f172a; font-size: 13px;">${driver.name}</strong>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${driver.vehicleNumber || "Lorry"}</div>
          <div style="color: #10b981; font-size: 11px; font-weight: 700; margin-top: 2px;">Live Location</div>
        </div>
      `);
    }
  }, [driver?.name, driver?.vehicleNumber, driver?.profileImage, createTruckIcon, telemetry.heading, telemetry.isOnline]);

  // 3. Socket.IO Real-Time Listener for THIS DRIVER ONLY (TASK 3 & 4)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      // Strictly match ONLY this driver
      const matchesDriver =
        data.driverId === driverId ||
        data.userId === driverId ||
        data.fleetDriverId === driverId ||
        (driver && (data.driverId === driver.userId || data.driverId === driver._id || data.driverId === driver.id));

      if (!matchesDriver) return;

      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const speed = data.speed !== null && data.speed !== undefined ? Number(data.speed) : null;
      const accuracy = Number(data.accuracy) || 0;
      const heading = data.heading !== null && data.heading !== undefined ? Number(data.heading) : null;
      const lastUpdated = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();

      setTelemetry({
        latitude: lat,
        longitude: lng,
        accuracy,
        speed,
        heading,
        lastUpdated,
        isOnline: true,
      });

      // Update Nominatim geocoded location details
      if (data.area) {
        setNominatimLocation({
          place: data.area,
          area: data.area,
          road: data.road || "",
          landmark: data.landmark || "",
          district: data.district ? (data.district.toLowerCase().includes("district") ? data.district : `${data.district} District`) : `${driver?.district || "Salem"} District`,
          state: data.state || "Tamil Nadu",
          postcode: data.postcode || "",
          country: "India",
          fullAddress: data.fullAddress || "",
          updatedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
        });
      } else {
        reverseGeocodeNominatim(lat, lng, data.district || driver?.district || "Salem").then((res) => {
          if (res) setNominatimLocation(res);
        });
      }

      // Move marker smoothly without reloading map or page (TASK 4 & 5)
      animateMarker(lat, lng, heading, true);
    };

    const handleStatusChange = (data) => {
      const matchesDriver =
        data.driverId === driverId ||
        data.userId === driverId ||
        data.fleetDriverId === driverId ||
        (driver && (data.driverId === driver.userId || data.driverId === driver._id || data.driverId === driver.id));

      if (!matchesDriver) return;

      setTelemetry((prev) => ({
        ...prev,
        isOnline: Boolean(data.isOnline),
        lastUpdated: data.lastUpdated || new Date().toISOString(),
      }));

      if (data.isOnline === false && markerInstanceRef.current) {
        markerInstanceRef.current.setIcon(createTruckIcon(telemetry.heading || 0, false, driver?.name || "Driver", driver?.profileImage));
      }
    };

    socket.on("admin:driver_location", handleLocationUpdate);
    socket.on("admin:driver_status_change", handleStatusChange);

    return () => {
      socket.off("admin:driver_location", handleLocationUpdate);
      socket.off("admin:driver_status_change", handleStatusChange);
    };
  }, [animateMarker, createTruckIcon, driver, driverId, telemetry.heading]);

  // 4. Update relative time every 10 seconds (TASK 7)
  useEffect(() => {
    const updateRelativeTime = () => {
      if (!telemetry.lastUpdated) {
        setRelativeTimeStr("No updates yet");
        return;
      }

      const diffSec = Math.floor((Date.now() - new Date(telemetry.lastUpdated).getTime()) / 1000);

      if (diffSec < 15) {
        setRelativeTimeStr("Just now");
      } else if (diffSec < 60) {
        setRelativeTimeStr(`${diffSec} seconds ago`);
      } else if (diffSec < 3600) {
        const mins = Math.floor(diffSec / 60);
        setRelativeTimeStr(`${mins} minute${mins > 1 ? "s" : ""} ago`);
      } else {
        const hrs = Math.floor(diffSec / 3600);
        setRelativeTimeStr(`${hrs} hour${hrs > 1 ? "s" : ""} ago`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 10000);
    return () => clearInterval(interval);
  }, [telemetry.lastUpdated]);

  // TASK 7: DRIVER STATUS CALCULATION
  const getComputedStatus = () => {
    const isCheckedIn = Boolean(driver?.isCheckedIn || driver?.status === "CHECKED IN");

    if (!isCheckedIn) {
      return {
        label: "OFFLINE",
        dotColor: "bg-rose-500",
        badgeStyle: "bg-rose-500/10 text-rose-500 border-rose-500/30",
        icon: "🔴",
      };
    }

    if (!telemetry.lastUpdated) {
      return {
        label: "LOCATION TEMPORARILY UNAVAILABLE",
        dotColor: "bg-amber-500",
        badgeStyle: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        icon: "🟠",
      };
    }

    const diffSec = (Date.now() - new Date(telemetry.lastUpdated).getTime()) / 1000;
    // If no update received for > 90 seconds, mark as temporarily unavailable
    if (diffSec > 90) {
      return {
        label: "LOCATION TEMPORARILY UNAVAILABLE",
        dotColor: "bg-amber-500",
        badgeStyle: "bg-amber-500/10 text-amber-500 border-amber-500/30",
        icon: "🟠",
      };
    }

    return {
      label: "LIVE",
      dotColor: "bg-emerald-500",
      badgeStyle: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
      icon: "🟢",
    };
  };

  const statusInfo = getComputedStatus();

  // Helper formatting for clock display
  const formatClockTime = (dateVal) => {
    if (!dateVal) return "--:-- --";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "--:-- --";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Recenter map on driver button
  const handleRecenter = () => {
    if (mapInstanceRef.current && telemetry.latitude && telemetry.longitude) {
      mapInstanceRef.current.panTo([Number(telemetry.latitude), Number(telemetry.longitude)], {
        animate: true,
        duration: 1,
      });
      mapInstanceRef.current.setZoom(16);
      toast.info(tr("Map centered on driver position"));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* TASK 9: Top Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => navigate("/admin/drivers")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer self-start"
          style={{ borderColor: "var(--border)", color: "var(--text2)" }}
        >
          <FiArrowLeft />
          <span>{tr("← Back to Drivers")}</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDriverData}
            className="p-2 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text2)" }}
            title="Refresh driver telemetry"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main Page Title & Live Status Bar */}
      <div
        className="glass p-5 sm:p-6 rounded-3xl border shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-500">
              Live Fleet Telemetry
            </span>
            <span className="text-xs opacity-40">•</span>
            <span className="text-xs text-slate-400 font-mono">
              Vehicle: {driver?.vehicleNumber || "Lorry"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5" style={{ color: "var(--text)" }}>
            LIVE DRIVER TRACKING
          </h1>

          <p className="text-base font-bold mt-1 text-slate-700 dark:text-slate-300">
            🚚 <span className="text-violet-600 dark:text-violet-400 font-black">{driver?.name || "Driver"}</span>
            <span className="opacity-50 mx-2">|</span>
            <span className="font-mono text-sm">{driver?.vehicleNumber}</span>
          </p>
        </div>

        {/* Dynamic Status Pill (TASK 7) */}
        <div className="flex flex-col items-start md:items-end gap-1.5 flex-shrink-0">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-black border tracking-wide shadow-sm ${statusInfo.badgeStyle}`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dotColor} ${statusInfo.label === "LIVE" ? "animate-ping" : ""}`}></span>
            <span>{statusInfo.icon} {statusInfo.label}</span>
          </span>

          <p className="text-[11px] font-semibold" style={{ color: "var(--text3)" }}>
            {statusInfo.label === "OFFLINE" ? (
              <span>Shift Ended: {formatClockTime(driver?.checkedOutAt || telemetry.lastUpdated)}</span>
            ) : (
              <span>Last Updated: {relativeTimeStr}</span>
            )}
          </p>
        </div>
      </div>

      {/* TASK 4: LEAFLET MAP CONTAINER (FREE OPENSTREETMAP) */}
      <div
        className="rounded-3xl border shadow-2xl overflow-hidden relative"
        style={{
          borderColor: "var(--border)",
          background: "var(--card, var(--bg3))",
          minHeight: "420px",
          height: "55vh",
          maxHeight: "620px",
        }}
      >
        {/* Recenter & Map Controls Overlay */}
        {mapReady && (
          <div className="absolute top-4 right-4 z-[500] flex items-center gap-2">
            <button
              onClick={handleRecenter}
              className="px-3.5 py-2 rounded-xl glass border shadow-md text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-white dark:hover:bg-slate-800 transition"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              title="Center map on driver"
            >
              <FiMaximize2 className="text-emerald-500" />
              <span>Center Driver</span>
            </button>
          </div>
        )}

        {/* Leaflet Map Div */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center glass space-y-3 z-10">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold" style={{ color: "var(--text2)" }}>
              Initializing Live Map View…
            </p>
          </div>
        )}
      </div>

      {/* LIVE TELEMETRY & NOMINATIM GEOLOCATION SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            LIVE TELEMETRY & LOCATION DETAILS
          </h2>
        </div>

        {/* Two Primary Telemetry Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CARD 1: SPEED & KINEMATICS */}
          <div
            className="p-6 rounded-3xl border shadow-lg flex flex-col justify-between"
            style={{
              background: "var(--card, var(--bg3))",
              borderColor: "rgba(14, 165, 233, 0.3)",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sky-500 font-extrabold text-xs tracking-wider">
                  <FiZap className="text-base" />
                  <span>SPEED & DYNAMICS</span>
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    telemetry.speed > 0
                      ? "bg-sky-500/15 text-sky-500 border-sky-500/30"
                      : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                  }`}
                >
                  {telemetry.speed > 0 ? "IN MOTION" : "STATIONARY"}
                </span>
              </div>

              {/* Speed Hero Display */}
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-5xl font-black tracking-tight" style={{ color: "var(--text)" }}>
                  {telemetry.speed !== null && telemetry.speed !== undefined ? telemetry.speed : 0}
                </span>
                <span className="text-lg font-bold text-sky-500">km/h</span>
              </div>

              {/* Progress bar visual */}
              <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden my-3">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(Math.max(((telemetry.speed || 0) / 80) * 100, 4), 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: DETAILED LIVE LOCATION */}
          <div
            className="lg:col-span-2 p-6 rounded-3xl border shadow-lg flex flex-col justify-between"
            style={{
              background: "var(--card, var(--bg3))",
              borderColor: "rgba(16, 185, 129, 0.3)",
            }}
          >
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs tracking-wider">
                  <FiMapPin className="text-base" />
                  <span>CURRENT LOCATION</span>
                </div>
                {isGeocoding && (
                  <span className="text-[11px] font-bold text-sky-500 animate-pulse flex items-center gap-1">
                    <FiRefreshCw className="animate-spin text-xs" />
                    <span>Resolving address…</span>
                  </span>
                )}
              </div>

              {/* Location Data Rows */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* 1. Area / Locality */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-lg flex-shrink-0 border border-sky-500/20">
                    🏘️
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text3)" }}>
                      Area / Locality
                    </span>
                    <p className="text-base font-black mt-0.5 leading-snug" style={{ color: "var(--text)" }}>
                      {nominatimLocation.area || nominatimLocation.place || "Acquiring Area..."}
                    </p>
                  </div>
                </div>

                {/* 2. Road / Street / Landmark */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-lg flex-shrink-0 border border-indigo-500/20">
                    🛣️
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text3)" }}>
                      Road / Landmark
                    </span>
                    <p className="text-sm font-extrabold mt-0.5" style={{ color: "var(--text)" }}>
                      {[nominatimLocation.landmark, nominatimLocation.road].filter(Boolean).join(" • ") || "Main Route"}
                    </p>
                  </div>
                </div>

                {/* 3. District */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg flex-shrink-0 border border-emerald-500/20">
                    🏛️
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text3)" }}>
                      District
                    </span>
                    <p className="text-base font-black mt-0.5 text-sky-600 dark:text-sky-400">
                      {nominatimLocation.district || `${driver?.district || "Salem"} District`}
                    </p>
                  </div>
                </div>

                {/* 4. State & Postal Code */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-lg flex-shrink-0 border border-amber-500/20">
                    🗺️
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text3)" }}>
                      State & Postal Code
                    </span>
                    <p className="text-base font-black mt-0.5 text-emerald-600 dark:text-emerald-400">
                      {nominatimLocation.state || "Tamil Nadu"}
                      {nominatimLocation.postcode ? `  (PIN: ${nominatimLocation.postcode})` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Address String */}
              {nominatimLocation.fullAddress && (
                <div className="mt-4 p-3 rounded-2xl border text-xs" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: "var(--text3)" }}>
                    Full Reverse-Geocoded Address:
                  </span>
                  <p className="font-semibold leading-relaxed" style={{ color: "var(--text2)" }}>
                    {nominatimLocation.fullAddress}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Last Updated */}
            {nominatimLocation.updatedAt ? (
              <div className="flex items-center justify-end gap-2 pt-3 mt-4 border-t text-[11px]" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text3)" }}>Last Updated:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{nominatimLocation.updatedAt}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Driver Quick Specs Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text3)" }}>Driver Name</span>
            <span className="text-sm font-black truncate block mt-0.5" style={{ color: "var(--text)" }}>{driver?.name || "Driver"}</span>
          </div>
          <div className="p-3.5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text3)" }}>Vehicle Number</span>
            <span className="text-sm font-black font-mono block mt-0.5 text-sky-600 dark:text-sky-400">{driver?.vehicleNumber || "Lorry"}</span>
          </div>
          <div className="p-3.5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text3)" }}>Contact Phone</span>
            <span className="text-sm font-black font-mono block mt-0.5" style={{ color: "var(--text)" }}>{driver?.phone || "N/A"}</span>
          </div>
          <div className="p-3.5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text3)" }}>Check-In</span>
            <span className="text-sm font-black font-mono block mt-0.5 text-emerald-600 dark:text-emerald-400">
              {formatClockTime(driver?.checkedInAt || driver?.tracking?.checkedInAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
