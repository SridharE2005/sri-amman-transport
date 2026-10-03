import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { compressImages, uploadImages } from "../../services/imageUpload";
import { FiBox, FiPackage, FiTruck, FiUploadCloud, FiTrash2, FiCamera } from "react-icons/fi";
import { GiBrickWall, GiStonePile, GiRiver, GiWheat } from "react-icons/gi";
import { useTheme } from "../../context/ThemeContext";

const DEFAULT_IMAGES = {
  Bricks: import.meta.env.VITE_DEFAULT_BRICKS_IMAGE_URL || "",
  "M-Sand": import.meta.env.VITE_DEFAULT_MSAND_IMAGE_URL || "",
  "River Sand": import.meta.env.VITE_DEFAULT_RIVER_SAND_IMAGE_URL || "",
  "Dry Grass Rolls": import.meta.env.VITE_DEFAULT_DRY_GRASS_IMAGE_URL || "",
};

const MATERIAL_TYPES = ["Bricks", "M-Sand", "River Sand", "Dry Grass Rolls"];
const ICONS = {
  Bricks: <GiBrickWall className="text-amber-500 inline-block align-middle" />,
  "M-Sand": <GiStonePile className="text-stone-400 inline-block align-middle" />,
  "River Sand": <GiRiver className="text-cyan-500 inline-block align-middle" />,
  "Dry Grass Rolls": <GiWheat className="text-emerald-500 inline-block align-middle" />,
};

const BRICK_TYPES = [
  "WireCut Bricks",
  "Box Bricks",
  "Normal Bricks",
  "Fly Ash Bricks",
  "Red Clay Bricks",
  "Chamber Bricks",
];

const normalizeGoodsImages = (item) => Array.isArray(item.image) && item.image.length
  ? item.image.map((image) => typeof image === "string" ? { url: image, publicId: "" } : image)
  : item.images?.length
    ? item.images.map((image, index) => ({ url: image, publicId: item.imagePublicIds?.[index] || "" }))
    : item.image ? [{ url: item.image, publicId: item.imagePublicId || "" }] : [];

  const getFirstImageUrl = (item) => normalizeGoodsImages(item)[0]?.url || DEFAULT_IMAGES[item.material];

const BRICK_INIT = { title: "", brickType: "", howManyBricks: "", pricePerBrick: "", quantityMin: "1000", quantityMax: "8000", status: "Available", assignedDriver: "", images: [] };
const SAND_INIT  = { title: "", units: "", pricePerUnit: "", status: "Available", assignedDriver: "", images: [] };
const GRASS_INIT = { title: "", noOfRolls: "", pricePerRoll: "", status: "Available", assignedDriver: "", images: [] };

const statusColor = {
  Available: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Limited:   "bg-amber-500/10  text-amber-500  border-amber-500/20",
  Full:      "bg-red-500/10    text-red-500    border-red-500/20",
};

const selectCls = "w-full px-4 py-2.5 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition";
const selStyle  = { background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" };

const Field = ({ label, children }) => {
  const { tr } = useTheme();
  return <div>
    <label className="block text-sm sm:text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
      {tr(label)}
    </label>
    {children}
  </div>;
};

const ImageUpload = ({ value = [], onChange, materialType }) => {
  const [uploading, setUploading] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const { tr } = useTheme();

  const handleFileChange = async (slotIndex, e) => {
    const files = Array.from(e.target.files).slice(0, 1);
    e.target.value = "";
    if (!files.length) return;

    setUploading(true);
    setActiveSlot(slotIndex);
    try {
      const compressedFiles = await compressImages(files);
      const nextImages = [...value];
      nextImages[slotIndex] = { file: compressedFiles[0], url: URL.createObjectURL(compressedFiles[0]), publicId: "" };
      onChange(nextImages.slice(0, 4));
    } catch (error) {
      toast.error(error.message || "Could not upload the selected images");
    } finally {
      setUploading(false);
      setActiveSlot(null);
    }
  };

  const removeSlot = (slotIndex) => {
    const nextImages = value.map((entry, idx) => (idx === slotIndex ? null : entry));
    onChange(nextImages);
  };

  return (
    <Field label="Images (up to 4)">
      <div className="mt-2.5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }, (_, index) => {
          const image = value[index];
          const hasCustomImage = Boolean(image?.url);
          const isFirstDefault = index === 0 && !value.some(Boolean) && Boolean(DEFAULT_IMAGES[materialType]);
          const preview = image?.url || (isFirstDefault ? DEFAULT_IMAGES[materialType] : "");
          const isSlotUploading = uploading && activeSlot === index;

          return (
            <div
              key={index}
              className={`relative rounded-2xl overflow-hidden border transition-all duration-200 group flex flex-col justify-between ${
                preview
                  ? "border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-md"
                  : "border-2 border-dashed border-[var(--border)] hover:border-violet-500/70 bg-[var(--surface)]/50 hover:bg-violet-500/5"
              }`}
              style={{ minHeight: "155px", height: "165px" }}
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt={`Image slot ${index + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGES[materialType];
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Gradient vignette for legible controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />

                  {/* Top Badges / Actions */}
                  <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-md text-white border border-white/10 shadow-sm flex items-center gap-1">
                      {index === 0 ? `★ ${tr("Cover Photo")}` : `${tr("Photo")} ${index + 1}`}
                      {isFirstDefault && <span className="opacity-75 font-normal ml-0.5">({tr("Default Preview")})</span>}
                    </span>
                    {hasCustomImage && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSlot(index);
                        }}
                        title="Remove image"
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-md backdrop-blur-md hover:scale-105"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Bottom Action Button / Replace */}
                  <label className="absolute inset-x-2 bottom-2 z-10 cursor-pointer rounded-xl bg-black/70 hover:bg-violet-600 text-white py-1.5 px-3 text-center text-xs font-semibold backdrop-blur-md transition-all flex items-center justify-center gap-1.5 shadow-sm border border-white/10">
                    <FiCamera className="w-3.5 h-3.5" />
                    <span>{hasCustomImage ? tr("Replace") : tr("Upload Custom Photo")}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={(event) => handleFileChange(index, event)}
                      className="hidden"
                    />
                  </label>
                </>
              ) : (
                /* Empty Slot state */
                <label className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer select-none">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center mb-2 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white transition-all shadow-sm">
                    <FiUploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text)] group-hover:text-violet-500 transition">
                    {tr("Upload Photo")}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text3)] mt-0.5">
                    {index === 0 ? "Slot 1 (Cover)" : `Slot ${index + 1}`}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(event) => handleFileChange(index, event)}
                    className="hidden"
                  />
                </label>
              )}

              {/* Uploading Spinner Overlay */}
              {isSlotUploading && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20 gap-1.5">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-[11px] font-semibold">{tr("Compressing...")}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between text-xs mt-2.5 text-[var(--text3)] gap-2">
        <span>
          {uploading ? (
            <span className="text-violet-500 font-medium animate-pulse">{tr("Compressing image...")}</span>
          ) : value.filter(Boolean).length ? (
            <span className="text-emerald-500 font-medium">✓ {value.filter(Boolean).length} {tr("custom image(s) ready to save")}</span>
          ) : (
            <span>{tr("Default image preview active (you can upload up to 4 custom photos)")}</span>
          )}
        </span>
        <span className="text-[11px] opacity-75">Max 4 images • Click any box to upload</span>
      </div>
    </Field>
  );
};

const StatusSelect = ({ value, onChange }) => {
  const { tr } = useTheme();
  return <Field label="Status">
    <select className={selectCls} style={selStyle} value={value} onChange={onChange}>
      {["Available", "Limited", "Full"].map((o) => <option key={o}>{tr(o)}</option>)}
    </select>
  </Field>;
};

const DriverSelect = ({ value, onChange, drivers }) => {
  const selectedDriver = drivers.find((d) => d._id === value);

  return (
    <Field label="Assign Driver">
      <div className="space-y-2.5 mt-1">
        {selectedDriver && (
          <div
            className="flex items-center justify-between p-3 rounded-xl border border-violet-500 bg-violet-500/10"
            style={{ borderColor: "rgba(139, 92, 246, 0.4)" }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {selectedDriver.profileImage ? (
                  <img src={selectedDriver.profileImage} alt={selectedDriver.name} className="w-full h-full object-cover" />
                ) : (
                  selectedDriver.name?.[0]?.toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{selectedDriver.name}</p>
                <p className="text-xs opacity-75" style={{ color: "var(--text2)" }}>{selectedDriver.vehicle} · {selectedDriver.phone}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onChange({ target: { value: "" } })}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition"
            >
              Remove
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {drivers.map((driver) => {
            const isSelected = value === driver._id;
            return (
              <button
                type="button"
                key={driver._id}
                onClick={() => onChange({ target: { value: driver._id } })}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                  isSelected
                    ? "border-violet-500 bg-violet-500/15 shadow-sm"
                    : "hover:border-violet-500/50 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
                style={{
                  borderColor: isSelected ? undefined : "var(--input-border)",
                  color: "var(--input-text)",
                  background: isSelected ? undefined : "var(--input-bg)",
                }}
              >
                <span className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {driver.profileImage ? (
                    <img src={driver.profileImage} alt={driver.name} className="w-full h-full object-cover" />
                  ) : (
                    driver.name?.[0]?.toUpperCase()
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm">{driver.name}</strong>
                  <small className="block truncate opacity-70">{driver.vehicle} · {driver.phone}</small>
                </span>
                {isSelected && <span className="text-violet-500 font-bold text-sm">✓</span>}
              </button>
            );
          })}
        </div>
        {!drivers.length && (
          <p className="text-xs text-amber-500 py-1 font-medium">
            No drivers found. Please add a driver in the Drivers section first.
          </p>
        )}
      </div>
    </Field>
  );
};

const SaveBtn = ({ saving, editId, label, onSubmit }) => {
  const { tr } = useTheme();
  return <button
    onClick={onSubmit}
    disabled={saving}
    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-base sm:text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
  >
    {saving ? tr("Saving…") : editId ? `${tr("Update")} ${tr(label)}` : `${tr("Add")} ${tr(label)}`}
  </button>
};

function TypeSelector({ onSelect }) {
  const { tr } = useTheme();
  return (
    <div className="glass p-5 sm:p-6">
      <h3 className="font-bold text-lg sm:text-base mb-2" style={{ color: "var(--text)" }}>{tr("Select Goods Type")}</h3>
      <p className="text-base sm:text-sm mb-5" style={{ color: "var(--text3)" }}>{tr("Choose the type of goods you want to add")}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MATERIAL_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="py-4 px-3 rounded-xl border text-base sm:text-sm font-semibold hover:border-violet-500 hover:text-violet-500 transition flex flex-col sm:flex-row items-center justify-center gap-2.5 group"
            style={{ borderColor: "var(--border)", color: "var(--text2)", background: "var(--surface)" }}
          >
            <span className="text-3xl sm:text-2xl transition-transform group-hover:scale-110">{ICONS[type]}</span>
            <span>{tr(type)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function BricksForm({ form, setForm, onSubmit, saving, editId, drivers }) {
  const { tr } = useTheme();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNumeric = (k) => (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setForm((f) => ({ ...f, [k]: val }));
  };

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-2xl sm:text-xl">{ICONS.Bricks}</span>
        <h3 className="font-bold text-lg sm:text-base" style={{ color: "var(--text)" }}>{editId ? "Edit Bricks" : "Add Bricks"}</h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Field label="Goods Title">
          <input className="input !mb-0 text-base sm:text-sm" placeholder="e.g. Red Clay Bricks" value={form.title} onChange={set("title")} />
        </Field>
        <Field label="Brick Type">
          <select className={selectCls} style={selStyle} value={form.brickType} onChange={set("brickType")}>
            <option value="" disabled>-- {tr("Select Brick Type")} --</option>
            {BRICK_TYPES.map((type) => (
              <option key={type} value={type} style={{ background: "var(--surface)", color: "var(--text)" }}>
                {tr(type)}
              </option>
            ))}
            {form.brickType && !BRICK_TYPES.includes(form.brickType) && (
              <option value={form.brickType} style={{ background: "var(--surface)", color: "var(--text)" }}>
                {form.brickType}
              </option>
            )}
          </select>
        </Field>
        <Field label="How Many Bricks">
          <input
            className="input !mb-0 text-base sm:text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 5000"
            value={form.howManyBricks}
            onChange={setNumeric("howManyBricks")}
          />
        </Field>
        <Field label="Price Per Brick (₹)">
          <input
            className="input !mb-0 text-base sm:text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 8"
            value={form.pricePerBrick}
            onChange={setNumeric("pricePerBrick")}
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-4">
          <DriverSelect value={form.assignedDriver} onChange={set("assignedDriver")} drivers={drivers} />
        </div>
        <div className="sm:col-span-2 lg:col-span-4">
          <ImageUpload materialType="Bricks" value={form.images} onChange={(val) => setForm((f) => ({ ...f, images: val }))} />
        </div>
      </div>
      <SaveBtn saving={saving} editId={editId} label="Bricks" onSubmit={onSubmit} />
    </div>
  );
}

function SandForm({ type, form, setForm, onSubmit, saving, editId, drivers }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNumeric = (k) => (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setForm((f) => ({ ...f, [k]: val }));
  };

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-2xl sm:text-xl">{ICONS[type]}</span>
        <h3 className="font-bold text-lg sm:text-base" style={{ color: "var(--text)" }}>{editId ? `Edit ${type}` : `Add ${type}`}</h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <Field label="Goods Title">
          <input className="input !mb-0 text-base sm:text-sm" placeholder={`e.g. Premium ${type}`} value={form.title} onChange={set("title")} />
        </Field>
        <Field label="No. of Units Available">
          <input
            className="input !mb-0 text-base sm:text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 200"
            value={form.units}
            onChange={setNumeric("units")}
          />
        </Field>
        <Field label="Price Per Unit (₹)">
          <input
            className="input !mb-0 text-base sm:text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 150"
            value={form.pricePerUnit}
            onChange={setNumeric("pricePerUnit")}
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <DriverSelect value={form.assignedDriver} onChange={set("assignedDriver")} drivers={drivers} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <ImageUpload materialType={type} value={form.images} onChange={(val) => setForm((f) => ({ ...f, images: val }))} />
        </div>
      </div>
      <SaveBtn saving={saving} editId={editId} label={type} onSubmit={onSubmit} />
    </div>
  );
}

function GrassForm({ form, setForm, onSubmit, saving, editId, drivers }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNumeric = (k) => (e) => {
    const val = e.target.value.replace(/\D/g, "");
    setForm((f) => ({ ...f, [k]: val }));
  };

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-2xl sm:text-xl">{ICONS["Dry Grass Rolls"]}</span>
        <h3 className="font-bold text-lg sm:text-base" style={{ color: "var(--text)" }}>{editId ? "Edit Dry Grass Rolls" : "Add Dry Grass Rolls"}</h3>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        <Field label="Goods Title">
          <input className="input !mb-0 text-base sm:text-sm" placeholder="e.g. Dry Paddy Straw Rolls" value={form.title} onChange={set("title")} />
        </Field>
        <Field label="No. of Rolls Available">
          <input
            className="input !mb-0 text-base sm:text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 100"
            value={form.noOfRolls}
            onChange={setNumeric("noOfRolls")}
          />
        </Field>
        <Field label="Price Per Roll (₹)">
          <input
            className="input !mb-0 text-base sm:text-sm"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 500"
            value={form.pricePerRoll}
            onChange={setNumeric("pricePerRoll")}
          />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <DriverSelect value={form.assignedDriver} onChange={set("assignedDriver")} drivers={drivers} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <ImageUpload materialType="Dry Grass Rolls" value={form.images} onChange={(val) => setForm((f) => ({ ...f, images: val }))} />
        </div>
      </div>
      <SaveBtn saving={saving} editId={editId} label="Grass Rolls" onSubmit={onSubmit} />
    </div>
  );
}

export default function AddGoods() {
  const { tr } = useTheme();
  const [goods, setGoods] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [editId, setEditId] = useState(null);

  const [brickForm, setBrickForm] = useState(BRICK_INIT);
  const [sandForm, setSandForm] = useState(SAND_INIT);
  const [grassForm, setGrassForm] = useState(GRASS_INIT);

  const fetchGoods = () => {
    setLoading(true);
    API.get("/goods").then(({ data }) => data)
      .then((data) => setGoods(data))
      .catch(() => toast.error(tr("Failed to load goods")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGoods();
    API.get("/drivers")
      .then(({ data }) => setDrivers(data.filter((driver) => driver.status !== "Off Duty")))
      .catch(() => toast.error(tr("Failed to load drivers")));
  }, []);

  const handleCancel = () => {
    setShowForm(false);
    setSelectedType(null);
    setEditId(null);
    setBrickForm(BRICK_INIT);
    setSandForm(SAND_INIT);
    setGrassForm(GRASS_INIT);
  };

  const save = async (payload, label) => {
    setSaving(true);

    try {
      const imagesToSave = (payload.images || []).filter(Boolean).slice(0, 4);
      const pendingImages = imagesToSave.filter((image) => image.file);
      const uploadedImages = pendingImages.length
        ? await uploadImages(pendingImages.map((image) => image.file), "transport-goods", { alreadyCompressed: true })
        : [];
      let uploadedIndex = 0;
      const savedImages = imagesToSave.slice(0, 4).map((image) => image.file
        ? uploadedImages[uploadedIndex++]
        : { url: image.url, publicId: image.publicId || "" });
      const goodsPayload = { ...payload };
      delete goodsPayload.images;
      const finalPayload = { ...goodsPayload, image: savedImages };

      if (editId) {
        await API.put(`/goods/${editId}`, finalPayload);
        toast.success(`${tr(label)} ${tr("updated")}`);
      } else {
        await API.post("/goods", finalPayload);
        toast.success(`${tr(label)} ${tr("added")}`);
      }
      handleCancel();
      fetchGoods();
    } catch (err) {
      console.error("Goods save failed:", err.response?.data || err);
      toast.error(tr(err.response?.data?.message || "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitBricks = () => {
    const { title, brickType, howManyBricks, pricePerBrick } = brickForm;
    if (!title || !brickType || !howManyBricks || !pricePerBrick || !brickForm.assignedDriver) {
      toast.error(tr("Please fill all fields"));
      return;
    }
    save(
      {
        material: "Bricks",
        ...brickForm,
        howManyBricks: Number(howManyBricks),
        pricePerBrick: Number(pricePerBrick),
      },
      "Bricks"
    );
  };

  const handleSubmitSand = () => {
    const { title, units, pricePerUnit } = sandForm;
    if (!title || !units || !pricePerUnit || !sandForm.assignedDriver) {
      toast.error(tr("Please fill all fields"));
      return;
    }
    save(
      {
        material: selectedType,
        ...sandForm,
        units: Number(units),
        pricePerUnit: Number(pricePerUnit),
      },
      selectedType
    );
  };

  const handleSubmitGrass = () => {
    const { title, noOfRolls, pricePerRoll } = grassForm;
    if (!title || !noOfRolls || !pricePerRoll || !grassForm.assignedDriver) {
      toast.error(tr("Please fill all fields"));
      return;
    }
    save(
      {
        material: "Dry Grass Rolls",
        ...grassForm,
        noOfRolls: Number(noOfRolls),
        pricePerRoll: Number(pricePerRoll),
      },
      "Dry Grass Rolls"
    );
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setShowForm(true);
    setSelectedType(item.material);
    if (item.material === "Bricks") {
      setBrickForm({
        title: item.title || "",
        brickType: item.brickType || "",
        howManyBricks: String(item.howManyBricks || ""),
        pricePerBrick: String(item.pricePerBrick || ""),
        quantityMin: String(item.quantityMin || "1000"),
        quantityMax: String(item.quantityMax || "8000"),
        status: item.status || "Available",
        assignedDriver: item.assignedDriver?._id || item.assignedDriver || "",
        image: "",
        images: normalizeGoodsImages(item),
      });
    } else if (item.material === "M-Sand" || item.material === "River Sand") {
      setSandForm({
        title: item.title || "",
        units: String(item.units || ""),
        pricePerUnit: String(item.pricePerUnit || ""),
        status: item.status || "Available",
        assignedDriver: item.assignedDriver?._id || item.assignedDriver || "",
        image: "",
        images: normalizeGoodsImages(item),
      });
    } else if (item.material === "Dry Grass Rolls") {
      setGrassForm({
        title: item.title || "",
        noOfRolls: String(item.noOfRolls || ""),
        pricePerRoll: String(item.pricePerRoll || ""),
        status: item.status || "Available",
        assignedDriver: item.assignedDriver?._id || item.assignedDriver || "",
        image: "",
        images: normalizeGoodsImages(item),
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/goods/${id}`);
      toast.success("Goods removed");
      fetchGoods();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const tableDetail = (g) => {
    if (g.material === "Bricks") return g.brickType || "—";
    if (g.material === "M-Sand" || g.material === "River Sand") return `${g.units} units`;
    if (g.material === "Dry Grass Rolls") return `${g.noOfRolls} rolls`;
    return "—";
  };

  const tablePrice = (g) => {
    if (g.material === "Bricks") return `₹${g.pricePerBrick}/brick`;
    if (g.material === "M-Sand" || g.material === "River Sand") return `₹${g.pricePerUnit}/unit`;
    if (g.material === "Dry Grass Rolls") return `₹${g.pricePerRoll}/roll`;
    return "—";
  };

  const tableQty = (g) => {
    if (g.material === "Bricks") return `${g.howManyBricks} bricks`;
    if (g.material === "M-Sand" || g.material === "River Sand") return `${g.units} units`;
    if (g.material === "Dry Grass Rolls") return `${g.noOfRolls} rolls`;
    return "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--text)" }}>{tr("Add Goods")}</h2>
          <p className="text-base sm:text-sm mt-1" style={{ color: "var(--text3)" }}>{tr("Manage available transport stock")}</p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              handleCancel();
            } else {
              setShowForm(true);
              setSelectedType(null);
            }
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-base sm:text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-violet-500/20"
        >
          {showForm ? `✕ ${tr("Cancel")}` : `+ ${tr("Add Goods")}`}
        </button>
      </div>

      {showForm && !selectedType && <TypeSelector onSelect={setSelectedType} />}
      {showForm && selectedType === "Bricks" && (
        <BricksForm form={brickForm} setForm={setBrickForm} onSubmit={handleSubmitBricks} saving={saving} editId={editId} drivers={drivers} />
      )}
      {showForm && (selectedType === "M-Sand" || selectedType === "River Sand") && (
        <SandForm type={selectedType} form={sandForm} setForm={setSandForm} onSubmit={handleSubmitSand} saving={saving} editId={editId} drivers={drivers} />
      )}
      {showForm && selectedType === "Dry Grass Rolls" && (
        <GrassForm form={grassForm} setForm={setGrassForm} onSubmit={handleSubmitGrass} saving={saving} editId={editId} drivers={drivers} />
      )}

      <div className="glass overflow-hidden">
        <div className="px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="font-bold text-base sm:text-sm" style={{ color: "var(--text)" }}>{tr("Current Stock")} — {goods.length} {tr("entries")}</p>
        </div>
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium" style={{ color: "var(--text3)" }}>{tr("Loading material inventory…")}</p>
          </div>
        ) : goods.length === 0 ? (
          <div className="p-12 text-center text-base sm:text-sm" style={{ color: "var(--text3)" }}>No goods added yet. Click "+ Add Goods" to start.</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Image", "Material", "Details", "Price", "Quantity", "Assigned Driver", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {goods.map((g, i) => {
                    const fallback = DEFAULT_IMAGES[g.material];
                    const imageUrl = getFirstImageUrl(g);
                    return (
                      <tr
                        key={g._id}
                        className="hover:bg-violet-500/5 transition"
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: i % 2 !== 0 ? "var(--surface)" : "transparent",
                        }}
                      >
                        <td className="px-5 py-3">
                          <img
                            src={imageUrl}
                            alt={g.material}
                            onError={(e) => { e.currentTarget.src = fallback; }}
                            className="w-14 h-14 object-cover rounded-lg border border-[var(--border)]"
                          />
                        </td>
                        <td className="px-5 py-3 font-semibold" style={{ color: "var(--text)" }}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl flex-shrink-0">{ICONS[g.material]}</span>
                            <span>{tr(g.material)}</span>
                          </div>
                          {g.title && <p className="text-xs font-normal opacity-75 mt-0.5 ml-7" style={{ color: "var(--text3)" }}>{g.title}</p>}
                        </td>
                        <td className="px-5 py-3" style={{ color: "var(--text2)" }}>{tableDetail(g)}</td>
                        <td className="px-5 py-3 font-semibold text-violet-500">{tablePrice(g)}</td>
                        <td className="px-5 py-3" style={{ color: "var(--text2)" }}>{tableQty(g)}</td>
                        <td className="px-5 py-3">
                          {g.assignedDriver ? (
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {g.assignedDriver.profileImage ? (
                                  <img src={g.assignedDriver.profileImage} alt={g.assignedDriver.name} className="w-full h-full object-cover" />
                                ) : (
                                  g.assignedDriver.name?.[0]?.toUpperCase()
                                )}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs truncate" style={{ color: "var(--text)" }}>{g.assignedDriver.name}</p>
                                <p className="text-[11px] truncate opacity-70" style={{ color: "var(--text3)" }}>{g.assignedDriver.vehicle || "Vehicle"} · {g.assignedDriver.phone}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-500/80 font-medium italic">Not assigned</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor[g.status]}`}>{tr(g.status)}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(g)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition">Edit</button>
                            <button onClick={() => handleDelete(g._id)} className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 transition">Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y" style={{ borderColor: "var(--border)" }}>
              {goods.map((g) => {
                const fallback = DEFAULT_IMAGES[g.material];
                const imageUrl = getFirstImageUrl(g);
                const typeDetail = g.material === "Bricks" ? (g.brickType || "—") : g.material === "M-Sand" || g.material === "River Sand" ? "Sand" : "Rolls";

                const infoRows = [
                  { label: "Material Type", value: g.material },
                  { label: "Price", value: tablePrice(g) },
                  { label: "Type", value: typeDetail },
                  { label: "Quantity", value: tableQty(g) },
                ];

                return (
                  <div key={g._id} className="p-4 space-y-3">
                    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                      <img
                        src={imageUrl}
                        alt={g.material}
                        onError={(e) => { e.currentTarget.src = fallback; }}
                        className="w-full h-40 object-cover"
                      />
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xl flex-shrink-0">{ICONS[g.material]}</span>
                          <p className="text-lg font-extrabold leading-tight" style={{ color: "var(--text)" }}>
                            {g.title || g.material}
                          </p>
                        </div>
                        {g.title && (
                          <p className="text-xs mt-0.5 ml-7" style={{ color: "var(--text3)" }}>
                            {tr(g.material)}
                          </p>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${statusColor[g.status]}`}>
                        {tr(g.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                      {infoRows.map(({ label, value }) => (
                        <div key={label} className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--text3)" }}>
                            {label}
                          </p>
                          <p className={`mt-1 ${label === "Price" ? "text-base font-extrabold text-emerald-500" : "text-sm font-medium"}`} style={{ color: label === "Price" ? undefined : "var(--text2)" }}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Assigned Driver Box in Mobile Card */}
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <span className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                        {g.assignedDriver?.profileImage ? (
                          <img src={g.assignedDriver.profileImage} alt={g.assignedDriver.name} className="w-full h-full object-cover" />
                        ) : (
                          g.assignedDriver?.name?.[0]?.toUpperCase() || "D"
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-500">Assigned Driver</p>
                        {g.assignedDriver ? (
                          <p className="text-xs font-bold leading-tight truncate" style={{ color: "var(--text)" }}>
                            {g.assignedDriver.name} <span className="font-normal opacity-70">({g.assignedDriver.vehicle || "Vehicle"})</span>
                          </p>
                        ) : (
                          <p className="text-xs italic text-amber-500">No driver assigned</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                      <button onClick={() => handleEdit(g)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500/10 text-blue-500 active:scale-95 transition">Edit</button>
                      <button onClick={() => handleDelete(g._id)} className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-500 active:scale-95 transition">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}