import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";
import { uploadImages } from "../../services/imageUpload";
import { getSocket } from "../../services/socket";
import { reverseGeocodeNominatim } from "../../services/nominatim";
import {
  FiActivity,
  FiCalendar,
  FiClock,
  FiEdit,
  FiMail,
  FiMapPin,
  FiNavigation,
  FiPhone,
  FiRadio,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiTruck,
  FiX,
  FiZap,
} from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { DriversSkeleton } from "../../components/AdminSkeletons";

const INIT_FORM = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicleNumber: "",
  vehicleType: "Lorry",
  district: "Salem",
  experience: "2 yrs",
  profileImage: "",
  profileImagePublicId: "",
};

const VEHICLE_TYPES = [
  "Lorry",
  "6-Wheel Lorry",
  "10-Wheel Lorry",
  "12-Wheel Lorry",
  "Tractor",
  "Tipper Lorry",
  "Other Vehicle",
];

const DISTRICTS = [
  "Salem",
  "Namakkal",
  "Erode",
  "Dharmapuri",
  "Coimbatore",
  "Tirupur",
  "Karur",
  "Trichy",
  "Other District",
];

const selectCls =
  "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition";
const selStyle = {
  background: "var(--input-bg)",
  border: "1px solid var(--input-border)",
  color: "var(--input-text)",
};

const DriverImageUpload = ({ value, onChange, name }) => {
  const { tr } = useTheme();
  const [uploading, setUploading] = useState(false);

  const handleChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = "";
    setUploading(true);
    try {
      const [{ url, publicId }] = await uploadImages([file], "transport-drivers");
      onChange(url, publicId);
    } catch (error) {
      toast.error(tr(error.message || "Could not upload the driver image"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-4">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-md">
        {value ? (
          <img src={value} alt={`${name || "Driver"} profile`} className="w-full h-full object-cover" />
        ) : (
          name?.[0]?.toUpperCase() || "?"
        )}
      </div>
      <div>
        <label
          className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
          style={{ color: "var(--text3)" }}
        >
          {tr("Profile Image (optional)")}
        </label>
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={handleChange}
          className="input !mb-0 text-sm"
        />
        <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>
          {uploading ? tr("Uploading image...") : tr("Driver profile photo (optional).")}
        </p>
      </div>
    </div>
  );
};

export default function Drivers() {
  const { tr } = useTheme();
  const navigate = useNavigate();

  // Primary Tab state: "accounts" (default) | "live_tracking"
  const [activeTab, setActiveTab] = useState("accounts");

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INIT_FORM);
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [editId, setEditId] = useState(null);

  // Accounts Tab: Driver Details Modal State
  const [selectedDetailDriver, setSelectedDetailDriver] = useState(null);

  // Search filter
  const [search, setSearch] = useState("");

  // Live Tracking telemetry state received via Socket.IO & API
  const [liveLocations, setLiveLocations] = useState({});

  const fetchDrivers = () => {
    setLoading(true);
    API.get("/drivers")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setDrivers(list);

        // Populate initial liveLocations from database tracking
        const initialLocs = {};
        list.forEach((dr) => {
          const trk = dr.tracking || {};
          const lastLoc = dr.lastLocation || {};
          const lat = trk.latitude || lastLoc.latitude;
          const lng = trk.longitude || lastLoc.longitude;
          const key = dr.userId || dr._id;

          const isOnline = Boolean(
            dr.isCheckedIn ||
            dr.status === "CHECKED IN" ||
            dr.driverStatus === "CHECKED IN" ||
            dr.dutyStatus === "On Duty" ||
            trk.isOnline
          );

          if (lat && lng) {
            initialLocs[key] = {
              driverId: key,
              userId: dr.userId || dr._id,
              driverName: dr.name,
              vehicleNumber: dr.vehicleNumber || dr.vehicle || "N/A",
              vehicleType: dr.vehicleType || "Lorry",
              district: dr.district || "Salem",
              latitude: lat,
              longitude: lng,
              speed: trk.speed !== undefined ? trk.speed : lastLoc.speed || 0,
              area: trk.area || lastLoc.area || dr.district || "Salem",
              road: trk.road || lastLoc.road || "",
              state: trk.state || lastLoc.state || "Tamil Nadu",
              postcode: trk.postcode || lastLoc.postcode || "",
              fullAddress: trk.fullAddress || lastLoc.fullAddress || "",
              isOnline,
              checkedInAt: dr.checkedInAt || null,
              lastUpdated: trk.lastUpdated || lastLoc.updatedAt,
              formattedTime: trk.lastUpdated
                ? new Date(trk.lastUpdated).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })
                : "Active",
            };

            // Reverse-geocode via Nominatim if area is not cached
            if (!trk.area && !lastLoc.area) {
              reverseGeocodeNominatim(lat, lng, dr.district || "Salem").then((res) => {
                if (res) {
                  setLiveLocations((prev) => {
                    if (!prev[key]) return prev;
                    return {
                      ...prev,
                      [key]: {
                        ...prev[key],
                        area: res.area,
                        road: res.road,
                        district: res.district,
                        state: res.state,
                        postcode: res.postcode,
                        fullAddress: res.fullAddress,
                      },
                    };
                  });
                }
              });
            }
          }
        });

        setLiveLocations((prev) => ({ ...initialLocs, ...prev }));
      })
      .catch(() => toast.error(tr("Failed to load drivers")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Socket.IO Connection & Real-Time Event Subscriptions
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      socket.emit("admin:request_active_drivers", (activeList) => {
        if (Array.isArray(activeList)) {
          setLiveLocations((prev) => {
            const updated = { ...prev };
            activeList.forEach((d) => {
              updated[d.driverId] = {
                ...d,
                lastUpdated: d.lastUpdated || new Date().toISOString(),
              };
            });
            return updated;
          });
        }
      });
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);

    socket.on("admin:active_drivers_list", (driversList) => {
      if (Array.isArray(driversList)) {
        setLiveLocations((prev) => {
          const updated = { ...prev };
          driversList.forEach((d) => {
            updated[d.driverId] = {
              ...d,
              lastUpdated: d.lastUpdated || new Date().toISOString(),
            };
          });
          return updated;
        });
      }
    });

    socket.on("admin:driver_location", (data) => {
      const formattedTime = new Date(data.timestamp || data.lastUpdated).toLocaleTimeString(
        "en-US",
        { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }
      );

      const key = data.driverId || data.userId;

      setLiveLocations((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          ...data,
          isOnline: true,
          formattedTime,
        },
      }));

      // If area not in payload, resolve via Nominatim
      if (!data.area && data.latitude && data.longitude) {
        reverseGeocodeNominatim(data.latitude, data.longitude, data.district || "Salem").then(
          (res) => {
            if (res) {
              setLiveLocations((prev) => {
                if (!prev[key]) return prev;
                return {
                  ...prev,
                  [key]: {
                    ...prev[key],
                    area: res.area,
                    road: res.road,
                    district: res.district,
                    state: res.state,
                    postcode: res.postcode,
                    fullAddress: res.fullAddress,
                  },
                };
              });
            }
          }
        );
      }
    });

    socket.on("admin:driver_status_change", (data) => {
      setLiveLocations((prev) => {
        const existing = prev[data.driverId] || {};
        return {
          ...prev,
          [data.driverId]: {
            ...existing,
            ...data,
            isOnline: Boolean(data.isOnline),
          },
        };
      });
      fetchDrivers();
    });

    return () => {
      socket.off("connect", onConnect);
      socket.off("admin:active_drivers_list");
      socket.off("admin:driver_location");
      socket.off("admin:driver_status_change");
    };
  }, []);

  // Filter on-duty drivers for Live Tracking tab
  const onDutyDrivers = useMemo(() => {
    return drivers.filter((dr) => {
      const key = dr.userId || dr._id;
      const live = liveLocations[key];
      return Boolean(
        dr.isCheckedIn ||
        dr.status === "CHECKED IN" ||
        dr.driverStatus === "CHECKED IN" ||
        dr.dutyStatus === "On Duty" ||
        (live && live.isOnline)
      );
    });
  }, [drivers, liveLocations]);

  const setFormField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (
      !form.name?.trim() ||
      !form.email?.trim() ||
      !form.phone?.trim() ||
      !form.vehicleNumber?.trim() ||
      !form.vehicleType?.trim() ||
      !form.district?.trim()
    ) {
      toast.error(tr("Please fill all required fields"));
      return;
    }

    if (!editId && (!form.password || form.password.trim().length < 6)) {
      toast.error(tr("Password must be at least 6 characters"));
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await API.put(`/drivers/${editId}`, form);
        toast.success(tr("Driver updated successfully"));
      } else {
        await API.post("/drivers", form);
        toast.success(tr("Driver account created with role 'driver'"));
      }
      setForm(INIT_FORM);
      setShowForm(false);
      setEditId(null);
      fetchDrivers();
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to save driver"));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (dr) => {
    setForm({
      name: dr.name || "",
      email: dr.email || "",
      password: "",
      phone: dr.phone || dr.phoneNumber || "",
      vehicleNumber: dr.vehicleNumber || "",
      vehicleType: dr.vehicleType || "Lorry",
      district: dr.district || "Salem",
      experience: dr.experience || "2 yrs",
      profileImage: dr.profileImage || "",
      profileImagePublicId: dr.profileImagePublicId || "",
    });
    setEditId(dr._id);
    setShowForm(true);
    setSelectedDetailDriver(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(tr("Are you sure you want to remove this driver and their account?"))) {
      return;
    }
    try {
      await API.delete(`/drivers/${id}`);
      toast.success(tr("Driver removed"));
      if (selectedDetailDriver?._id === id) setSelectedDetailDriver(null);
      fetchDrivers();
    } catch {
      toast.error(tr("Failed to remove driver"));
    }
  };

  // Filtered drivers for Accounts directory
  const filteredDrivers = drivers.filter(
    (d) =>
      (d.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.phone || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.vehicleNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.vehicle || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.district || "").toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total: drivers.length,
    onDuty: onDutyDrivers.length,
    offDuty: drivers.length - onDutyDrivers.length,
  };

  // Helper for check-in time format
  const formatCheckInTime = (val) => {
    if (!val) return "Not Available";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "Not Available";
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "Not Available";
    }
  };

  // Helper for last updated time format
  const formatLastUpdatedTime = (val) => {
    if (!val) return "Active";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "Active";
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return "Active";
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Page Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--text)" }}>
            {tr("Drivers")}
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text3)" }}>
            {tr("Manage driver accounts and monitor on-duty live tracking")}
          </p>
        </div>

        {/* Action Button: Create Driver Account */}
        <button
          type="button"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
              setEditId(null);
            } else {
              setForm(INIT_FORM);
              setEditId(null);
              setSelectedDetailDriver(null);
              setShowForm(true);
            }
          }}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          {showForm ? (
            <>
              <FiX className="text-base" />
              <span>{tr("Cancel")}</span>
            </>
          ) : (
            <>
              <span>+</span>
              <span>{tr("Add Driver")}</span>
            </>
          )}
        </button>
      </div>

      {/* TWO PRIMARY TABS: Accounts (Default) & Live Tracking */}
      <div
        className="p-1.5 rounded-2xl glass border flex items-center gap-1.5"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Tab 1: Accounts (Default) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("accounts");
            setShowForm(false);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "accounts"
              ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
              : "hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          style={{ color: activeTab === "accounts" ? "#ffffff" : "var(--text2)" }}
        >
          <FiTruck className="text-base" />
          <span>{tr("Accounts")}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "accounts" ? "bg-white/25 text-white" : "bg-black/10 dark:bg-white/10"
            }`}
          >
            {counts.total}
          </span>
        </button>

        {/* Tab 2: Live Tracking */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("live_tracking");
            setShowForm(false);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "live_tracking"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25"
              : "hover:bg-black/5 dark:hover:bg-white/5"
          }`}
          style={{ color: activeTab === "live_tracking" ? "#ffffff" : "var(--text2)" }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>{tr("Live Tracking")}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "live_tracking" ? "bg-white/25 text-white" : "bg-emerald-500/15 text-emerald-500"
            }`}
          >
            {counts.onDuty} {tr("On Duty")}
          </span>
        </button>
      </div>

      {/* Driver Creation / Edit Form */}
      {showForm && (
        <div className="glass p-5 sm:p-6 rounded-2xl border border-violet-500/30 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg" style={{ color: "var(--text)" }}>
                {editId ? tr("Edit Driver Account") : tr("Create New Driver Account")}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                {tr("Driver will be granted driver portal access with role 'driver'")}
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: "var(--text3)" }}
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <DriverImageUpload
              value={form.profileImage}
              onChange={(profileImage, profileImagePublicId) =>
                setForm((current) => ({ ...current, profileImage, profileImagePublicId }))
              }
              name={form.name}
            />

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Full Name *")}
              </label>
              <input
                className="input !mb-0 text-sm"
                placeholder="e.g. Ramesh Kumar"
                value={form.name}
                onChange={setFormField("name")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Email (Login) *")}
              </label>
              <input
                className="input !mb-0 text-sm"
                type="email"
                placeholder="e.g. ramesh@gmail.com"
                value={form.email}
                onChange={setFormField("email")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {editId ? tr("New Password (optional)") : tr("Password *")}
              </label>
              <div className="relative">
                <input
                  className="input !mb-0 text-sm pr-14"
                  type={showPass ? "text" : "password"}
                  placeholder={editId ? tr("Leave blank to keep current") : "e.g. Ramesh@123"}
                  value={form.password}
                  onChange={setFormField("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium cursor-pointer"
                  style={{ color: "var(--text3)" }}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Phone Number *")}
              </label>
              <input
                className="input !mb-0 text-sm"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={setFormField("phone")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Vehicle Number *")}
              </label>
              <input
                className="input !mb-0 font-mono uppercase text-sm"
                placeholder="e.g. TN-30-AB-1234"
                value={form.vehicleNumber}
                onChange={setFormField("vehicleNumber")}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Vehicle Type *")}
              </label>
              <select
                className={selectCls}
                style={selStyle}
                value={form.vehicleType}
                onChange={setFormField("vehicleType")}
              >
                {VEHICLE_TYPES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("District *")}
              </label>
              <select
                className={selectCls}
                style={selStyle}
                value={form.district}
                onChange={setFormField("district")}
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Experience")}
              </label>
              <input
                className="input !mb-0 text-sm"
                placeholder="e.g. 3 yrs"
                value={form.experience}
                onChange={setFormField("experience")}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-500/20 hover:opacity-90 disabled:opacity-50 transition cursor-pointer"
            >
              {saving ? tr("Saving…") : editId ? tr("Update Driver") : tr("Save Driver Account")}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditId(null);
              }}
              className="px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text2)" }}
            >
              {tr("Cancel")}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 1: ACCOUNTS (DEFAULT VIEW)
          ======================================================== */}
      {activeTab === "accounts" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Search Bar & Duty Stat Badges */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl glass border"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="relative flex-1 min-w-0">
              <FiSearch
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "var(--text3)" }}
              />
              <input
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--input-text)",
                }}
                placeholder={tr("Search by name, email, phone, vehicle...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Quick Status Count Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              >
                <span>{tr("Total:")}</span>
                <span className="font-extrabold text-violet-500">{counts.total}</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>
                  {counts.onDuty} {tr("On Duty")}
                </span>
              </span>
              <span className="px-3 py-1.5 rounded-xl border border-slate-500/20 text-xs font-bold text-slate-500 bg-slate-500/10 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                <span>
                  {counts.offDuty} {tr("Off Duty")}
                </span>
              </span>
            </div>
          </div>

          {/* Accounts Driver Cards Grid */}
          {loading ? (
            <DriversSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers.map((dr) => {
                const isOnDuty = Boolean(
                  dr.isCheckedIn ||
                  dr.status === "CHECKED IN" ||
                  dr.driverStatus === "CHECKED IN" ||
                  dr.dutyStatus === "On Duty" ||
                  liveLocations[dr.userId || dr._id]?.isOnline
                );

                return (
                  <div
                    key={dr._id}
                    onClick={() => setSelectedDetailDriver(dr)}
                    className="group rounded-2xl border p-4 sm:p-5 transition hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--card, var(--bg3))",
                    }}
                  >
                    <div>
                      {/* Driver Card Header: Photo + Name + Duty Tag */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-black text-white flex-shrink-0 shadow-md">
                            {dr.profileImage ? (
                              <img src={dr.profileImage} alt={dr.name} className="w-full h-full object-cover" />
                            ) : (
                              dr.name?.[0]?.toUpperCase() || "D"
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3
                              className="font-extrabold text-sm sm:text-base truncate group-hover:text-violet-500 transition"
                              style={{ color: "var(--text)" }}
                            >
                              {dr.name}
                            </h3>
                            <p className="text-xs truncate font-mono mt-0.5" style={{ color: "var(--text3)" }}>
                              {dr.phone || "No phone"}
                            </p>
                          </div>
                        </div>

                        {/* On Duty / Off Duty Tag */}
                        <span
                          className={`text-[11px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${
                            isOnDuty
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                              : "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/25"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`}
                          ></span>
                          <span>{isOnDuty ? tr("On Duty") : tr("Off Duty")}</span>
                        </span>
                      </div>

                      {/* Driver Details List */}
                      <div className="mt-3.5 space-y-1.5 text-xs" style={{ color: "var(--text2)" }}>
                        {dr.email && (
                          <div className="flex items-center gap-2 truncate" title={dr.email}>
                            <FiMail className="flex-shrink-0 text-violet-500" />
                            <span className="truncate">{dr.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <FiTruck className="flex-shrink-0 text-blue-500" />
                          <span className="font-mono font-bold">{dr.vehicleNumber || dr.vehicle || "N/A"}</span>
                          {dr.vehicleType && <span className="opacity-70">({dr.vehicleType})</span>}
                        </div>
                        {dr.district && (
                          <div className="flex items-center gap-2">
                            <FiMapPin className="flex-shrink-0 text-emerald-500" />
                            <span>{dr.district}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Row: ONLY Edit and Delete buttons */}
                    <div
                      className="mt-4 pt-3 border-t flex items-center gap-2"
                      style={{ borderColor: "var(--border)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleEdit(dr)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FiEdit className="text-xs" />
                        <span>{tr("Edit")}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(dr._id)}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FiTrash2 className="text-xs" />
                        <span>{tr("Delete")}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredDrivers.length === 0 && (
                <div
                  className="col-span-full py-12 text-center rounded-2xl glass border p-6"
                  style={{ borderColor: "var(--border)" }}
                >
                  <FiTruck className="text-3xl mx-auto mb-2 text-violet-500 opacity-60" />
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
                    {tr("No drivers found matching your search")}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>
                    {tr("Click '+ Add Driver' to create a new driver account")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ACCOUNTS TAB: DRIVER DETAILS MODAL (OPENED ON CARD CLICK)
          ======================================================== */}
      {selectedDetailDriver && (
        <div
          className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedDetailDriver(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border space-y-4 max-h-[90vh] overflow-y-auto"
            style={{
              background: "var(--card, var(--bg3))",
              borderColor: "var(--border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-extrabold text-base sm:text-lg" style={{ color: "var(--text)" }}>
                {tr("Driver Profile & Details")}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedDetailDriver(null)}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                style={{ color: "var(--text3)" }}
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Profile Avatar & Primary Badges */}
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-3xl font-black text-white mb-2 shadow-lg">
                {selectedDetailDriver.profileImage ? (
                  <img
                    src={selectedDetailDriver.profileImage}
                    alt={selectedDetailDriver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedDetailDriver.name?.[0]?.toUpperCase() || "D"
                )}
              </div>
              <h4 className="font-black text-lg" style={{ color: "var(--text)" }}>
                {selectedDetailDriver.name}
              </h4>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                    selectedDetailDriver.isCheckedIn ||
                    selectedDetailDriver.status === "CHECKED IN" ||
                    selectedDetailDriver.driverStatus === "CHECKED IN" ||
                    selectedDetailDriver.dutyStatus === "On Duty" ||
                    liveLocations[selectedDetailDriver.userId || selectedDetailDriver._id]?.isOnline
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-slate-500/10 text-slate-500 border-slate-500/25"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedDetailDriver.isCheckedIn ||
                      selectedDetailDriver.status === "CHECKED IN" ||
                      selectedDetailDriver.driverStatus === "CHECKED IN" ||
                      selectedDetailDriver.dutyStatus === "On Duty" ||
                      liveLocations[selectedDetailDriver.userId || selectedDetailDriver._id]?.isOnline
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-slate-400"
                    }`}
                  ></span>
                  <span>
                    {selectedDetailDriver.isCheckedIn ||
                    selectedDetailDriver.status === "CHECKED IN" ||
                    selectedDetailDriver.driverStatus === "CHECKED IN" ||
                    selectedDetailDriver.dutyStatus === "On Duty" ||
                    liveLocations[selectedDetailDriver.userId || selectedDetailDriver._id]?.isOnline
                      ? tr("On Duty")
                      : tr("Off Duty")}
                  </span>
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
                  {tr("Role: Driver")}
                </span>
              </div>
            </div>

            {/* Details Grid */}
            <div className="space-y-2.5 text-xs">
              {[
                { icon: <FiPhone className="text-violet-500" />, label: tr("Phone"), value: selectedDetailDriver.phone || "N/A" },
                { icon: <FiMail className="text-violet-500" />, label: tr("Email (Login)"), value: selectedDetailDriver.email || "N/A" },
                {
                  icon: <FiTruck className="text-blue-500" />,
                  label: tr("Vehicle"),
                  value: `${selectedDetailDriver.vehicleNumber || selectedDetailDriver.vehicle || "N/A"} (${selectedDetailDriver.vehicleType || "Lorry"})`,
                },
                { icon: <FiMapPin className="text-emerald-500" />, label: tr("District"), value: selectedDetailDriver.district || "Salem" },
                { icon: <FiClock className="text-amber-500" />, label: tr("Experience"), value: selectedDetailDriver.experience || "2 yrs" },
                {
                  icon: <FiCalendar className="text-sky-500" />,
                  label: tr("Registered Date"),
                  value: selectedDetailDriver.createdAt
                    ? new Date(selectedDetailDriver.createdAt).toLocaleDateString("en-IN")
                    : "N/A",
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "var(--text3)" }}>
                      {label}
                    </p>
                    <p className="text-xs font-bold truncate mt-0.5" style={{ color: "var(--text)" }}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col gap-2 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={() => {
                  const driverId = selectedDetailDriver.userId || selectedDetailDriver._id;
                  setSelectedDetailDriver(null);
                  navigate(`/admin/drivers/${driverId}/live-tracking`);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <FiNavigation className="text-sm" />
                <span>{tr("Open Dedicated Live Tracking Page")}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const toEdit = selectedDetailDriver;
                    setSelectedDetailDriver(null);
                    handleEdit(toEdit);
                  }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition cursor-pointer"
                >
                  {tr("Edit Driver")}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDetailDriver(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                >
                  {tr("Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: LIVE TRACKING (ONLY CARDS - CLICK OPENS DEDICATED TRACKING PAGE)
          ======================================================== */}
      {activeTab === "live_tracking" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Top Bar with On-Duty Count & Refresh */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 sm:p-4 rounded-2xl glass border border-emerald-500/20"
            style={{ borderColor: "var(--border)" }}
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 className="font-black text-sm sm:text-base" style={{ color: "var(--text)" }}>
                  {tr("ON-DUTY LIVE TRACKING")}
                </h3>
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                {tr("Click any driver card to open their dedicated real-time GPS live tracking page")}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                {onDutyDrivers.length} {tr("Drivers On Duty")}
              </span>
              <button
                type="button"
                onClick={() => {
                  const s = getSocket();
                  if (s) {
                    s.emit("admin:request_active_drivers");
                    toast.info(tr("Refreshing live telemetry"));
                  }
                  fetchDrivers();
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--text2)" }}
              >
                <FiRefreshCw className="text-emerald-500 text-xs" />
                <span>{tr("Refresh")}</span>
              </button>
            </div>
          </div>

          {/* ON-DUTY DRIVER CARDS ONLY */}
          {onDutyDrivers.length === 0 ? (
            <div
              className="glass p-12 text-center rounded-2xl border space-y-2.5"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl mx-auto border border-emerald-500/20">
                <FiRadio className="animate-pulse" />
              </div>
              <h4 className="text-base font-bold" style={{ color: "var(--text)" }}>
                {tr("No Drivers Currently On Duty")}
              </h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: "var(--text3)" }}>
                {tr(
                  "When drivers check in from their mobile app, their live tracking cards will appear here immediately."
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {onDutyDrivers.map((dr) => {
                const key = dr.userId || dr._id;
                const live = liveLocations[key] || {};
                const currentSpeed = live.speed || 0;
                const motionState = currentSpeed > 0 ? "Moving" : "Stationary";

                return (
                  <div
                    key={dr._id}
                    onClick={() => navigate(`/admin/drivers/${key}/live-tracking`)}
                    className="group rounded-2xl border p-4 sm:p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    style={{
                      background: "var(--card, var(--bg3))",
                      borderColor: "rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <div>
                      {/* Driver Name + Photo + On Duty Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-base font-black text-white flex-shrink-0 shadow-md">
                            {dr.profileImage ? (
                              <img src={dr.profileImage} alt={dr.name} className="w-full h-full object-cover" />
                            ) : (
                              dr.name?.[0]?.toUpperCase() || "D"
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4
                              className="font-extrabold text-sm sm:text-base truncate group-hover:text-emerald-500 transition"
                              style={{ color: "var(--text)" }}
                            >
                              {dr.name}
                            </h4>
                            <p className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400 truncate mt-0.5">
                              {dr.vehicleNumber || dr.vehicle || "N/A"}
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>{tr("On Duty")}</span>
                        </span>
                      </div>

                      {/* Driver Details & Live Telemetry Snippet */}
                      <div className="mt-3.5 space-y-2 text-xs" style={{ color: "var(--text2)" }}>
                        {/* Vehicle Type */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                            {tr("Vehicle:")}
                          </span>
                          <span className="font-semibold truncate max-w-[170px]">
                            {dr.vehicleType || "Lorry"}
                          </span>
                        </div>

                        {/* Location / Area */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                            {tr("Location:")}
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[170px]">
                            📍 {live.area || live.district || dr.district || "Acquiring Area..."}
                          </span>
                        </div>

                        {/* Speed & State */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                            {tr("Speed & State:")}
                          </span>
                          <span className="font-mono font-bold text-sky-500">
                            {currentSpeed} km/h • {motionState}
                          </span>
                        </div>

                        {/* Check-in Time */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                            {tr("Check-in Time:")}
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCheckInTime(dr.checkedInAt || live.checkedInAt)}
                          </span>
                        </div>

                        {/* Last GPS Update */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                            {tr("Last GPS Update:")}
                          </span>
                          <span className="font-mono text-[11px]" style={{ color: "var(--text3)" }}>
                            {formatLastUpdatedTime(live.lastUpdated || dr.tracking?.lastUpdated)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dedicated Tracking Navigation Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/drivers/${key}/live-tracking`);
                      }}
                      className="w-full mt-4 py-2.5 px-3 rounded-xl text-xs font-black tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FiNavigation className="text-sm" />
                      <span>{tr("TRACK LIVE LOCATION")}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
