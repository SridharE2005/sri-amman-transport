// src/pages/admin/DriverDetails.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";
import { reverseGeocodeNominatim } from "../../services/nominatim";
import { useTheme } from "../../context/ThemeContext";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiCompass,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiRadio,
  FiShield,
  FiTruck,
  FiUser,
  FiZap,
} from "react-icons/fi";

export default function DriverDetails() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { tr } = useTheme();

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationDetails, setLocationDetails] = useState({
    area: "",
    road: "",
    district: "",
    state: "Tamil Nadu",
    postcode: "",
    fullAddress: "",
  });

  const fetchDriver = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(`/drivers/${driverId}`);
      setDriver(data);

      const lat = data.tracking?.latitude || data.lastLocation?.latitude;
      const lng = data.tracking?.longitude || data.lastLocation?.longitude;

      if (data.tracking?.area || data.lastLocation?.area) {
        setLocationDetails({
          area: data.tracking?.area || data.lastLocation?.area,
          road: data.tracking?.road || data.lastLocation?.road || "",
          district: data.tracking?.district || data.lastLocation?.district || `${data.district || "Salem"} District`,
          state: data.tracking?.state || data.lastLocation?.state || "Tamil Nadu",
          postcode: data.tracking?.postcode || data.lastLocation?.postcode || "",
          fullAddress: data.tracking?.fullAddress || data.lastLocation?.fullAddress || "",
        });
      } else if (lat && lng) {
        reverseGeocodeNominatim(lat, lng, data.district || "Salem").then((res) => {
          if (res) setLocationDetails(res);
        });
      }
    } catch (err) {
      console.error("[DriverDetails] Failed to load driver:", err);
      const msg = err.response?.data?.message || "Failed to load driver details";
      setError(msg);
      toast.error(tr(msg));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (driverId) {
      fetchDriver();
    }
  }, [driverId]);

  // Format timestamp to hh:mm A
  const formatTimeAMPM = (dateString) => {
    if (!dateString) return "Not Recorded";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Not Recorded";
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="glass p-8 rounded-3xl space-y-4">
          <div className="h-20 w-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto" />
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate("/admin/drivers")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
          style={{ borderColor: "var(--border)", color: "var(--text2)" }}
        >
          <FiArrowLeft />
          <span>{tr("Back to Drivers")}</span>
        </button>

        <div className="glass p-12 text-center rounded-3xl border border-rose-500/20 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl mx-auto border border-rose-500/20">
            ⚠️
          </div>
          <h3 className="text-xl font-black" style={{ color: "var(--text)" }}>
            {error || "Driver Not Found"}
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text3)" }}>
            The requested driver account could not be found or you do not have permission to view it.
          </p>
          <button
            onClick={() => navigate("/admin/drivers")}
            className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-lg shadow-violet-500/20 transition cursor-pointer"
          >
            Return to Fleet Drivers
          </button>
        </div>
      </div>
    );
  }

  const isOnline = Boolean(
    driver.isOnline ||
    driver.status === "CHECKED IN" ||
    driver.driverStatus === "CHECKED IN" ||
    driver.dutyStatus === "On Duty"
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          onClick={() => navigate("/admin/drivers")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer self-start"
          style={{ borderColor: "var(--border)", color: "var(--text2)" }}
        >
          <FiArrowLeft />
          <span>{tr("← Back to Drivers")}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
            Driver ID: {driver._id?.slice(-6)?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div
        className="glass p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Driver Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-violet-500/20 flex-shrink-0 border-2 border-white/20">
              {driver.profileImage ? (
                <img src={driver.profileImage} alt={driver.name} className="w-full h-full object-cover" />
              ) : (
                driver.name?.[0]?.toUpperCase() || "D"
              )}
            </div>

            {/* Driver Identity */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-500">
                  Fleet Driver
                </span>
                <span className="text-xs opacity-40">•</span>
                <span className="text-xs font-bold text-slate-400">
                  {driver.district || "Salem"}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text)" }}>
                🚚 {driver.name}
              </h1>

              {/* Status Indicator */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                    isOnline
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-500 border-rose-500/30"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-500 animate-ping" : "bg-rose-500"}`}></span>
                  <span>{isOnline ? "🟢 Online" : "🔴 Offline"}</span>
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>
                  {driver.vehicleNumber || "No Vehicle"}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-bold border" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>
                  {driver.vehicleType || "Lorry"}
                </span>
              </div>
            </div>
          </div>

          {/* Prominent Track Live Location CTA Button (TASK 2) */}
          <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
            <button
              onClick={() => navigate(`/admin/drivers/${driver._id}/live-tracking`)}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-base font-black tracking-wide shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 flex items-center justify-center gap-3 transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
            >
              <FiNavigation className="text-xl animate-pulse" />
              <span>[ 📍 TRACK LIVE LOCATION ]</span>
            </button>
            <p className="text-[11px] text-center sm:text-right" style={{ color: "var(--text3)" }}>
              {isOnline ? "Live GPS telemetry streaming active" : "View driver telemetry & last known location"}
            </p>
          </div>
        </div>
      </div>

      {/* Driver Information Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Email */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Email Address
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <FiMail />
            </div>
          </div>
          <div>
            <p className="text-base font-black truncate" style={{ color: "var(--text)" }} title={driver.email}>
              {driver.email || "N/A"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
              Driver Login ID
            </p>
          </div>
        </div>

        {/* Phone */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Phone Number
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <FiPhone />
            </div>
          </div>
          <div>
            <p className="text-base font-black font-mono" style={{ color: "var(--text)" }}>
              {driver.phone || "N/A"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
              Contact Number
            </p>
          </div>
        </div>

        {/* Vehicle */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Assigned Vehicle
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FiTruck />
            </div>
          </div>
          <div>
            <p className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
              {driver.vehicleNumber || "N/A"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
              {driver.vehicleType || "Lorry"}
            </p>
          </div>
        </div>

        {/* District */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              District
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FiMapPin />
            </div>
          </div>
          <div>
            <p className="text-base font-black" style={{ color: "var(--text)" }}>
              {driver.district || "Salem"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
              Operational Region
            </p>
          </div>
        </div>

        {/* Check-In Time */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Shift Check-In
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <FiClock />
            </div>
          </div>
          <div>
            <p className="text-base font-black font-mono text-teal-600 dark:text-teal-400">
              {formatTimeAMPM(driver.checkedInAt || driver.tracking?.checkedInAt)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
              {driver.checkedInAt ? "Shift Started" : "Not Checked In"}
            </p>
          </div>
        </div>

        {/* Experience */}
        <div
          className="p-5 rounded-2xl border flex flex-col justify-between"
          style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Driving Experience
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FiCalendar />
            </div>
          </div>
          <div>
            <p className="text-base font-black" style={{ color: "var(--text)" }}>
              {driver.experience || "1+ Years"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
              Professional Record
            </p>
          </div>
        </div>
      </div>

      {/* CURRENT LOCATION & LIVE MAP SNAPSHOT (NOMINATIM) */}
      {(driver.tracking?.latitude || driver.lastLocation?.latitude) && (
        <div
          className="p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{ background: "var(--card, var(--bg3))", borderColor: "rgba(16, 185, 129, 0.35)" }}
        >
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                CURRENT LOCATION
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl" style={{ background: "var(--surface)" }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text3)" }}>
                  Current Area / Locality:
                </span>
                <p className="text-base font-black mt-0.5" style={{ color: "var(--text)" }}>
                  {locationDetails.area || driver.district || "Acquiring Area..."}
                </p>
                {locationDetails.road ? (
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{locationDetails.road}</p>
                ) : null}
              </div>

              <div className="p-3 rounded-2xl" style={{ background: "var(--surface)" }}>
                <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text3)" }}>
                  District & State:
                </span>
                <p className="text-base font-black mt-0.5 text-sky-600 dark:text-sky-400">
                  {locationDetails.district || `${driver.district || "Salem"} District`}
                </p>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {locationDetails.state || "Tamil Nadu"}
                  {locationDetails.postcode ? ` - ${locationDetails.postcode}` : ""}
                </p>
              </div>
            </div>

            {driver.tracking?.speed !== null && driver.tracking?.speed !== undefined && (
              <div className="flex items-center gap-1.5 pt-1 text-xs font-mono font-bold text-blue-500">
                <span>⚡ Speed:</span>
                <span>{driver.tracking.speed} km/h</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0">
            <Link
              to={`/admin/drivers/${driver._id}/live-tracking`}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <FiNavigation className="text-base" />
              <span>[ 📍 OPEN LIVE LOCATION MAP ]</span>
            </Link>
            <span className="text-[11px] text-center sm:text-right" style={{ color: "var(--text3)" }}>
              Real-time Live Location Map
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
