// src/pages/admin/Drivers.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { uploadImages } from "../../services/imageUpload";
import { FiCalendar, FiClock, FiPhone, FiTruck } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { DriversSkeleton } from "../../components/AdminSkeletons";

const INIT_FORM = { name: "", phone: "", vehicle: "", experience: "", profileImage: "", profileImagePublicId: "" };
const VEHICLE_TYPES = ["6-Wheel Lorry", "10-Wheel Lorry", "12-Wheel Lorry", "Other Vehicle"];

const statusColor = {
  "On Duty":   "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  "Available": "bg-blue-500/10    text-blue-500    border-blue-500/20",
  "Off Duty":  "bg-gray-500/10    text-gray-400    border-gray-500/20",
};

const selectCls = "w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition";
const selStyle  = { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" };

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
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
        {value ? <img src={value} alt={`${name || "Driver"} profile`} className="w-full h-full object-cover" /> : name?.[0]?.toUpperCase() || "?"}
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>{tr("Profile Image (optional)")}</label>
        <input type="file" accept="image/*" disabled={uploading} onChange={handleChange} className="input !mb-0 text-sm" />
        <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>{uploading ? tr("Uploading image...") : tr("Image stored in Cloudinary. If empty, the first letter is shown.")}</p>
      </div>
    </div>
  );
};

export default function Drivers() {
  const { tr } = useTheme();
  const [drivers,    setDrivers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [form,       setForm]       = useState(INIT_FORM);
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [viewDriver, setViewDriver] = useState(null);
  const [search,     setSearch]     = useState("");

  const fetchDrivers = () => {
    setLoading(true);
    API.get("/drivers").then(({ data }) => data)
      .then((data) => setDrivers(data))
      .catch(() => toast.error(tr("Failed to load drivers")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDrivers(); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.vehicle || !form.experience) {
      toast.error(tr("Please fill all fields")); return;
    }
    setSaving(true);
    try {
      if (editId) {
        await API.put(`/drivers/${editId}`, form);
        toast.success(tr("Driver updated"));
      } else {
        await API.post("/drivers", form);
        toast.success(tr("Driver added"));
      }
      setForm(INIT_FORM); setShowForm(false); setEditId(null);
      fetchDrivers();
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to save"));
    } finally { setSaving(false); }
  };

  const handleEdit = (dr) => {
    setForm({ name: dr.name, phone: dr.phone, vehicle: dr.vehicle, experience: dr.experience, profileImage: dr.profileImage || "", profileImagePublicId: dr.profileImagePublicId || "" });
    setEditId(dr._id); setShowForm(true); setViewDriver(null);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/drivers/${id}`);
      toast.success(tr("Driver removed"));
      if (viewDriver?._id === id) setViewDriver(null);
      fetchDrivers();
    } catch { toast.error(tr("Failed to remove driver")); }
  };

  const filtered = drivers.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.vehicle.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    total:     drivers.length,
    onDuty:    drivers.filter((d) => d.status === "On Duty").length,
    available: drivers.filter((d) => d.status === "Available").length,
    offDuty:   drivers.filter((d) => d.status === "Off Duty").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>{tr("Drivers")}</h2>
          <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>{tr("Manage your driver fleet")}</p>
        </div>
        <button
          onClick={() => { setForm(INIT_FORM); setEditId(null); setViewDriver(null); setShowForm((v) => !v); }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-violet-500/20"
        >
          {showForm ? "✕ Cancel" : "+ Add Driver"}
        </button>
      </div>

      {/* Summary */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4">
        {[
          { label: "Total Drivers", value: counts.total,     color: "from-violet-600 to-purple-600", icon: "🚛" },
          { label: "On Duty",       value: counts.onDuty,    color: "from-emerald-600 to-teal-600",  icon: "✅" },
          { label: "Available",     value: counts.available, color: "from-blue-600 to-cyan-600",     icon: "🟢" },
          { label: "Off Duty",      value: counts.offDuty,   color: "from-gray-600 to-slate-600",    icon: "⭕" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="glass p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-lg flex-shrink-0`}>{icon}</div>
            <div>
              <p className="text-xl font-extrabold" style={{ color: "var(--text)" }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--text3)" }}>{label}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Form */}
      {showForm && (
        <div className="glass p-6">
          <h3 className="font-bold text-base mb-5" style={{ color: "var(--text)" }}>{editId ? "Edit Driver" : "Add New Driver"}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <DriverImageUpload value={form.profileImage} onChange={(profileImage, profileImagePublicId) => setForm((current) => ({ ...current, profileImage, profileImagePublicId }))} name={form.name} />
            {[
              { label: "Full Name",   key: "name",       ph: "e.g. Selvam R" },
              { label: "Phone",       key: "phone",      ph: "e.g. 98421-XXXXX" },
              { label: "Experience",  key: "experience", ph: "e.g. 5 yrs" },
            ].map(({ label, key, ph }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>{label}</label>
                <input className="input !mb-0" placeholder={ph} value={form[key]} onChange={set(key)} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Vehicle Type</label>
              <select className={selectCls} style={selStyle} value={form.vehicle} onChange={set("vehicle")}>
                <option value="">Select vehicle</option>
                {VEHICLE_TYPES.map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving} className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50">
            {saving ? "Saving…" : editId ? "Update Driver" : "Add Driver"}
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className={`${viewDriver ? "lg:col-span-2" : "lg:col-span-3"} glass overflow-hidden`}>
          <div className="flex flex-col items-stretch gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>All Drivers ({filtered.length})</p>
            <input
              className="w-full sm:w-[180px] min-w-0 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }}
              placeholder="Search drivers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <DriversSkeleton />
          ) : (
            <div className="p-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((dr) => (
                <article key={dr._id} className="rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg cursor-pointer" onClick={() => setViewDriver(dr)} style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0">{dr.profileImage ? <img src={dr.profileImage} alt={dr.name} className="w-full h-full object-cover" /> : dr.name?.[0]}</div>
                      <div className="min-w-0">
                        <h3 className="font-bold break-words whitespace-normal" style={{ color: "var(--text)" }}>{dr.name}</h3>
                        <p className="text-xs truncate" style={{ color: "var(--text3)" }}>{dr.phone}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border whitespace-nowrap ${statusColor[dr.status]}`}>{dr.status}</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm" style={{ color: "var(--text2)" }}>
                    <p className="flex items-center gap-2"><FiTruck /> {dr.vehicle}</p>
                    <p className="flex items-center gap-2"><FiClock /> {dr.experience} experience</p>
                  </div>
                  <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleEdit(dr)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition">Edit</button>
                    <button onClick={() => handleDelete(dr._id)} className="flex-1 py-2 rounded-xl text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition">Remove</button>
                  </div>
                </article>
              ))}
              {filtered.length === 0 && <p className="sm:col-span-2 xl:col-span-3 py-10 text-center text-sm" style={{ color: "var(--text3)" }}>No drivers found. Add one above.</p>}
            </div>
          )}
        </div>

        {viewDriver && (
          <div className="glass p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base" style={{ color: "var(--text)" }}>Driver Details</h3>
              <button onClick={() => setViewDriver(null)} style={{ color: "var(--text3)" }}>✕</button>
            </div>
            <div className="flex flex-col items-center text-center py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white mb-3">{viewDriver.profileImage ? <img src={viewDriver.profileImage} alt={viewDriver.name} className="w-full h-full object-cover" /> : viewDriver.name[0]}</div>
              <p className="max-w-full break-words font-extrabold text-lg" style={{ color: "var(--text)" }}>{viewDriver.name}</p>
              <span className={`mt-2 text-xs font-semibold px-3 py-1 rounded-full border ${statusColor[viewDriver.status]}`}>{viewDriver.status}</span>
            </div>
            <div className="space-y-3">
              {[
                { icon: <FiPhone />, label: "Phone",      value: viewDriver.phone },
                { icon: <FiTruck />, label: "Vehicle",    value: viewDriver.vehicle },
                { icon: <FiClock />, label: "Experience", value: viewDriver.experience },
                { icon: <FiCalendar />, label: "Joined",     value: new Date(viewDriver.createdAt).toLocaleDateString("en-IN") },
              ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 min-w-0 p-3 rounded-xl" style={{ background: "var(--surface)" }}>
                  <span className="text-lg">{icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: "var(--text3)" }}>{label}</p>
                    <p className="text-sm font-semibold break-words" style={{ color: "var(--text)" }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleEdit(viewDriver)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition">Edit</button>
              <button onClick={() => handleDelete(viewDriver._id)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition">Remove</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
