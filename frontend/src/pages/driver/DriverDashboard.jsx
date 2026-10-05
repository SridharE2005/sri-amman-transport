// src/pages/driver/DriverDashboard.jsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import { getSocket } from "../../services/socket";
import logo from "../../assets/main-logo.png";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiCompass,
  FiLogOut,
  FiMapPin,
  FiMoon,
  FiNavigation,
  FiRadio,
  FiSun,
  FiTruck,
  FiUser,
  FiZap,
} from "react-icons/fi";

export default function DriverDashboard() {
  const { user, logout, updateUser } = useUser();
  const { theme, toggleTheme, tr } = useTheme();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [driverData, setDriverData] = useState({
    id: user?._id || user?.id || null,
    name: user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Driver",
    vehicleNumber: user?.vehicleNumber || "Not Assigned",
    vehicleType: user?.vehicleType || "Lorry",
    district: user?.district || "Salem",
    status: user?.status || "NOT CHECKED IN",
    phone: user?.phoneNumber || "",
    email: user?.email || "",
    checkedInAt: user?.checkedInAt || null,
    checkedOutAt: user?.checkedOutAt || null,
    lastLocation: user?.lastLocation || null,
    tracking: user?.tracking || null,
  });

  // TASK 4 & 6: Real-time driver live location tracking state
  const [liveLocation, setLiveLocation] = useState({
    latitude: user?.tracking?.latitude || user?.lastLocation?.latitude || null,
    longitude: user?.tracking?.longitude || user?.lastLocation?.longitude || null,
    accuracy: user?.tracking?.accuracy || user?.lastLocation?.accuracy || null,
    speed: user?.tracking?.speed !== undefined ? user?.tracking?.speed : null,
    heading: user?.tracking?.heading !== undefined ? user?.tracking?.heading : null,
    timestamp: null,
    lastUpdatedFormatted: null,
  });

  const watchIdRef = useRef(null);

  // Format timestamp to hh:mm:ss A (e.g. 09:42:10 AM)
  const formatTimeWithSeconds = (dateOrTimestamp) => {
    if (!dateOrTimestamp) return "--:--:-- --";
    const d = new Date(dateOrTimestamp);
    if (isNaN(d.getTime())) return "--:--:-- --";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  // Format timestamp to hh:mm A (e.g. 09:35 AM)
  const formatTimeAMPM = (dateString) => {
    if (!dateString) return "--:-- --";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "--:-- --";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Fetch verified driver state from server
  const fetchProfile = async () => {
    try {
      const { data } = await API.get("/drivers/me");
      if (data) {
        setDriverData((prev) => ({
          ...prev,
          id: data.id || prev.id,
          name: data.name || prev.name,
          vehicleNumber: data.vehicleNumber || prev.vehicleNumber,
          vehicleType: data.vehicleType || prev.vehicleType,
          district: data.district || prev.district,
          status: data.status || prev.status,
          phone: data.phone || prev.phone,
          email: data.email || prev.email,
          checkedInAt: data.checkedInAt || prev.checkedInAt,
          checkedOutAt: data.checkedOutAt || prev.checkedOutAt,
          lastLocation: data.lastLocation || prev.lastLocation,
          tracking: data.tracking || prev.tracking,
        }));

        if (data.tracking || data.lastLocation) {
          const loc = data.tracking || data.lastLocation;
          setLiveLocation((prev) => ({
            ...prev,
            latitude: loc.latitude || prev.latitude,
            longitude: loc.longitude || prev.longitude,
            accuracy: loc.accuracy || prev.accuracy,
            speed: loc.speed !== undefined ? loc.speed : prev.speed,
            heading: loc.heading !== undefined ? loc.heading : prev.heading,
            lastUpdatedFormatted: loc.lastUpdated
              ? formatTimeWithSeconds(loc.lastUpdated)
              : prev.lastUpdatedFormatted,
          }));
        }
      }
    } catch {
      // Fallback to existing session user
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const isCheckedIn = driverData.status === "CHECKED IN";

  // TASK 1 & 2: Continuous real-time tracking starts ONLY after check-in
  useEffect(() => {
    if (!isCheckedIn) {
      // Before check-in: NO continuous tracking
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      toast.error(tr("Geolocation is not supported by your device browser."));
      return;
    }

    const socket = getSocket();

    const onWatchSuccess = (position) => {
      const { latitude, longitude, accuracy, speed, heading } = position.coords;
      const timestamp = position.timestamp || Date.now();
      const formattedTime = formatTimeWithSeconds(timestamp);

      // TASK 2: Emit driver:location via Socket.IO
      const payload = {
        driverId: driverData.id || user?._id || user?.id,
        latitude,
        longitude,
        accuracy: typeof accuracy === "number" ? Math.round(accuracy * 10) / 10 : 0,
        speed:
          typeof speed === "number" && !isNaN(speed)
            ? Math.round(speed * 3.6 * 10) / 10
            : speed === 0
            ? 0
            : null, // km/h
        heading:
          typeof heading === "number" && !isNaN(heading) ? Math.round(heading) : null,
        timestamp,
      };

      if (socket && socket.connected) {
        socket.emit("driver:location", payload);
      }

      setLiveLocation({
        latitude,
        longitude,
        accuracy: payload.accuracy,
        speed: payload.speed,
        heading: payload.heading,
        timestamp,
        lastUpdatedFormatted: formattedTime,
      });
    };

    const onWatchError = (err) => {
      console.warn("[Driver Location Watch] Geolocation error:", err.code, err.message);
    };

    // Appropriate settings required by TASK 1
    const watchOptions = {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000,
    };

    const watchId = navigator.geolocation.watchPosition(
      onWatchSuccess,
      onWatchError,
      watchOptions
    );
    watchIdRef.current = watchId;

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      watchIdRef.current = null;
    };
  }, [isCheckedIn, driverData.id, user?._id, user?.id]);

  // TASK 1 & 2: Check-in with browser Geolocation API
  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast.error(tr("Unable to get your current location. Please enable location services and try again."));
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const timestamp = position.timestamp;

        try {
          // TASK 3: Submit initial GPS to backend; server generates official check-in time
          const { data } = await API.post("/drivers/checkin", {
            latitude,
            longitude,
            accuracy: typeof accuracy === "number" ? accuracy : 0,
            speed: typeof speed === "number" ? speed : null,
            heading: typeof heading === "number" ? heading : null,
            timestamp,
          });

          const serverTime = data.checkInTime || new Date().toISOString();

          setDriverData((prev) => ({
            ...prev,
            status: "CHECKED IN",
            checkedInAt: serverTime,
            lastLocation: {
              latitude,
              longitude,
              accuracy,
              speed,
              heading,
            },
          }));

          const initialFormatted = formatTimeWithSeconds(timestamp);
          setLiveLocation({
            latitude,
            longitude,
            accuracy: typeof accuracy === "number" ? Math.round(accuracy * 10) / 10 : 0,
            speed: typeof speed === "number" ? Math.round(speed * 3.6 * 10) / 10 : null,
            heading: typeof heading === "number" ? Math.round(heading) : null,
            timestamp,
            lastUpdatedFormatted: initialFormatted,
          });

          if (user) {
            updateUser({
              ...user,
              isCheckedIn: true,
              status: "CHECKED IN",
              checkedInAt: serverTime,
            });
          }

          toast.success(tr("Checked in successfully! You are now ON DUTY."));
        } catch (err) {
          toast.error(tr(err.response?.data?.message || "Failed to complete check-in on server."));
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error(
            tr("Location permission is required to check in. Please allow location access and try again.")
          );
        } else {
          toast.error(
            tr("Unable to get your current location. Please enable location services and try again.")
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // TASK 5: Confirm and perform check-out
  const handleConfirmCheckOut = async () => {
    setShowCheckoutConfirm(false);
    setLoading(true);

    // Call navigator.geolocation.clearWatch(watchId)
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    try {
      const { data } = await API.post("/drivers/checkout");
      const checkoutTime = data.checkedOutAt || new Date().toISOString();

      setDriverData((prev) => ({
        ...prev,
        status: "NOT CHECKED IN",
        checkedOutAt: checkoutTime,
        checkedInAt: null,
      }));

      // Stop sending updates and reset live location
      setLiveLocation({
        latitude: null,
        longitude: null,
        accuracy: null,
        speed: null,
        heading: null,
        timestamp: null,
        lastUpdatedFormatted: null,
      });

      if (user) {
        updateUser({
          ...user,
          isCheckedIn: false,
          status: "NOT CHECKED IN",
          checkedOutAt: checkoutTime,
        });
      }

      toast.info(tr("Checked out successfully. You are now OFF DUTY."));
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to check out. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.info("Logged out successfully");
    nav("/login");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between"
        style={{
          background: "var(--header-bg, rgba(15, 23, 42, 0.85))",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-3">
          <img src={logo} alt="Sri Amman Transport" className="h-9 w-auto object-contain rounded-lg" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight" style={{ color: "var(--text)" }}>
                Sri Amman Transport
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/15 text-violet-500 border border-violet-500/25">
                Driver Portal
              </span>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text3)" }}>
              சேலம் போக்குவரத்து — ஓட்டுநர் தளம்
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Switch */}
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text2)" }}
          >
            {theme === "dark" ? <FiSun className="text-amber-400" /> : <FiMoon className="text-slate-600" />}
          </button>

          {/* Mini Profile */}
          <div
            className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
              {driverData.name?.[0]?.toUpperCase() || "D"}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight truncate max-w-[120px]" style={{ color: "var(--text)" }}>
                {driverData.name}
              </p>
              <p className="text-[10px] text-violet-500 font-semibold uppercase">Driver</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/30 transition cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text2)" }}
          >
            <FiLogOut />
            <span>{tr("Logout")}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        {/* Title & Welcome Section */}
        <div className="pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <p className="section-tag">{tr("Fleet Operations")}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1" style={{ color: "var(--text)" }}>
            Driver Dashboard
          </h1>
          <p className="text-base sm:text-lg mt-1 font-medium" style={{ color: "var(--text2)" }}>
            Welcome, <span className="font-extrabold text-violet-600 dark:text-violet-400">{driverData.name}</span>
          </p>
        </div>

        {/* PRIMARY STATUS & ACTION CARD (TASK 1, 4, 5) */}
        <div
          className="rounded-3xl p-6 sm:p-8 border shadow-xl transition-all duration-300 relative overflow-hidden"
          style={{
            background: isCheckedIn
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.03) 100%), var(--card, var(--bg3))"
              : "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(185, 28, 28, 0.02) 100%), var(--card, var(--bg3))",
            borderColor: isCheckedIn ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.25)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                Status:
              </p>

              {/* Status Header: 🔴 NOT CHECKED IN or 🟢 CHECKED IN */}
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl">
                  {isCheckedIn ? "🟢" : "🔴"}
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: isCheckedIn ? "var(--emerald-500, #10b981)" : "#ef4444" }}
                >
                  {isCheckedIn ? "CHECKED IN" : "NOT CHECKED IN"}
                </h2>
              </div>

              {/* TASK 6: DRIVER DASHBOARD */}
              {isCheckedIn ? (
                <div className="pt-3 space-y-3 border-t" style={{ borderColor: "rgba(16, 185, 129, 0.2)" }}>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-wide">
                      🟢 LIVE LOCATION ACTIVE
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                        Last Location Update:
                      </p>
                      <p className="text-sm sm:text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        {liveLocation.lastUpdatedFormatted || formatTimeWithSeconds(driverData.checkedInAt)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                        Speed:
                      </p>
                      <p className="text-sm sm:text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                        {liveLocation.speed !== null && liveLocation.speed !== undefined
                          ? `${liveLocation.speed} km/h`
                          : "Stationary"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-3 space-y-1.5 border-t" style={{ borderColor: "rgba(239, 68, 68, 0.2)" }}>
                  <p className="text-sm font-black text-rose-500 flex items-center gap-2 tracking-wide">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>LOCATION TRACKING OFF</span>
                  </p>
                  <p className="text-xs" style={{ color: "var(--text3)" }}>
                    Click CHECK IN to request GPS location permission and start continuous live tracking.
                  </p>
                </div>
              )}
            </div>

            {/* Check-In / Check-Out Action Button */}
            <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
              {isCheckedIn ? (
                <button
                  type="button"
                  onClick={() => setShowCheckoutConfirm(true)}
                  disabled={loading}
                  className="px-8 py-3.5 rounded-2xl text-base font-black tracking-wider transition-all duration-200 cursor-pointer shadow-lg bg-rose-500/15 text-rose-500 border border-rose-500/35 hover:bg-rose-500 hover:text-white shadow-rose-500/10 flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>[ CHECK OUT ]</span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={loading}
                  className="px-8 py-3.5 rounded-2xl text-base font-black tracking-wider transition-all duration-200 cursor-pointer shadow-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40 flex items-center justify-center gap-2.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Requesting GPS...</span>
                    </>
                  ) : (
                    <span>[ CHECK IN ]</span>
                  )}
                </button>
              )}

              <p className="text-[11px] text-center sm:text-right" style={{ color: "var(--text3)" }}>
                {isCheckedIn ? "Click to record shift departure" : "Requires device location permission"}
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle & Assignment Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Vehicle */}
          <div
            className="p-5 rounded-2xl border flex flex-col justify-between"
            style={{
              background: "var(--card, var(--bg3))",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                Vehicle:
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-base">
                <FiTruck />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
                {driverData.vehicleNumber}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                Vehicle Number
              </p>
            </div>
          </div>

          {/* Vehicle Type */}
          <div
            className="p-5 rounded-2xl border flex flex-col justify-between"
            style={{
              background: "var(--card, var(--bg3))",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                Vehicle Type:
              </span>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center text-base">
                🚛
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black tracking-tight text-violet-600 dark:text-violet-400">
                {driverData.vehicleType}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                Category
              </p>
            </div>
          </div>

          {/* District */}
          <div
            className="p-5 rounded-2xl border flex flex-col justify-between"
            style={{
              background: "var(--card, var(--bg3))",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                District:
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-base">
                <FiMapPin />
              </div>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {driverData.district}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                Operational District
              </p>
            </div>
          </div>
        </div>

        {/* Location Status Details (Visible when checked in) */}
        {isCheckedIn && (liveLocation.latitude || driverData.lastLocation) && (
          <div
            className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-4 text-xs font-medium"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text2)",
            }}
          >
            <div className="flex items-center gap-2">
              <FiNavigation className="text-emerald-500 animate-pulse" />
              <span>
                Live GPS Position:{" "}
                <span className="font-mono font-bold" style={{ color: "var(--text)" }}>
                  {Number(liveLocation.latitude || driverData.lastLocation?.latitude).toFixed(6)},{" "}
                  {Number(liveLocation.longitude || driverData.lastLocation?.longitude).toFixed(6)}
                </span>
              </span>
            </div>
            {(liveLocation.accuracy || driverData.lastLocation?.accuracy) && (
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                Accuracy: ±{Math.round(liveLocation.accuracy || driverData.lastLocation?.accuracy)}m
              </span>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Socket.IO Live Transmitting</span>
            </div>
          </div>
        )}
      </main>

      {/* TASK 5: CHECK-OUT CONFIRMATION MODAL */}
      {showCheckoutConfirm &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ background: "rgba(0, 0, 0, 0.78)", backdropFilter: "blur(6px)" }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowCheckoutConfirm(false);
            }}
          >
            <div
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-200"
              style={{
                background: "var(--card, var(--bg3))",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-xl font-bold flex-shrink-0">
                  <FiAlertTriangle />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
                    Check Out Confirmation
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text3)" }}>
                    End your active shift
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium my-4" style={{ color: "var(--text2)" }}>
                Are you sure you want to check out?
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckOut}
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Checking out..." : "Yes, Check Out"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
