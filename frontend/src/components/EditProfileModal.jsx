// src/components/EditProfileModal.jsx
import { useEffect, useState } from "react";
import { FiX, FiCheck, FiUser, FiPhone, FiMail } from "react-icons/fi";
import { toast } from "react-toastify";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";
import AvatarSelector from "./AvatarSelector";
import { uploadImages } from "../services/imageUpload";
import { DEFAULT_AVATARS } from "../utils/defaultAvatars";

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const { tr } = useTheme();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });

  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState("");
  const [customFile, setCustomFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        email: user.email || "",
      });
      setSelectedAvatarUrl(user.profileImage || DEFAULT_AVATARS[0].url);
      setCustomFile(null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSelectAvatar = (url, file) => {
    setSelectedAvatarUrl(url);
    setCustomFile(file);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Optional or validate if entered
    const cleaned = phone.replace(/[\s\-()]/g, "");
    return /^\+?[0-9]{10,13}$/.test(cleaned);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error(tr("First name and last name are required"));
      return;
    }

    if (form.phoneNumber && !validatePhone(form.phoneNumber)) {
      toast.error(tr("Please enter a valid 10-digit phone number"));
      return;
    }

    setSaving(true);

    try {
      let finalAvatarUrl = selectedAvatarUrl;
      let avatarType = user.avatarType || "default";

      // If user selected a new custom file, upload to Cloudinary directly
      if (customFile) {
        setIsUploadingImage(true);
        try {
          const uploadRes = await uploadImages([customFile], "user-profiles");
          if (uploadRes?.[0]?.url) {
            finalAvatarUrl = uploadRes[0].url;
            avatarType = "custom";
          }
        } catch (uploadErr) {
          toast.error(tr(uploadErr.message || "Failed to upload custom image to Cloudinary"));
          setSaving(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      } else if (selectedAvatarUrl !== user.profileImage) {
        // Selected a default avatar from carousel
        avatarType = "default";
      }

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        email: user.role === "admin" ? user.email : form.email.trim(),
        profileImage: finalAvatarUrl,
        avatarType,
      };

      const { data } = await API.put("/auth/profile", payload);

      toast.success(tr("Profile updated successfully"));
      onProfileUpdated(data);
      onClose();
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to update profile"));
      // Keep popup open on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="glass max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 rounded-3xl relative border shadow-2xl"
        style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center text-lg">
              <FiUser />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>{tr("Edit Profile")}</h2>
              <p className="text-xs" style={{ color: "var(--text3)" }}>{tr("Update your photo and personal details")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            disabled={saving}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Avatar Selector Carousel & Upload */}
          <AvatarSelector
            selectedUrl={selectedAvatarUrl}
            customFile={customFile}
            onSelectAvatar={handleSelectAvatar}
            isUploading={isUploadingImage}
            accentColor="violet"
          />

          {/* First & Last Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("First Name")} *
              </label>
              <input
                className="input !mb-0"
                value={form.firstName}
                onChange={setField("firstName")}
                required
                disabled={saving}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Last Name")} *
              </label>
              <input
                className="input !mb-0"
                value={form.lastName}
                onChange={setField("lastName")}
                required
                disabled={saving}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              {tr("Phone Number")}
            </label>
            <div className="relative">
              <input
                className="input !mb-0 pl-10"
                type="tel"
                placeholder="9876543210"
                value={form.phoneNumber}
                onChange={setField("phoneNumber")}
                disabled={saving}
              />
              <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {tr("Email Address")}
              </label>
              {user.role === "admin" && (
                <span className="text-[11px] text-amber-500 font-medium">
                  ({tr("Admin email cannot be changed")})
                </span>
              )}
            </div>
            <div className="relative">
              <input
                className={`input !mb-0 pl-10 ${user.role === "admin" ? "opacity-60 cursor-not-allowed bg-white/5" : ""}`}
                type="email"
                value={form.email}
                onChange={setField("email")}
                disabled={saving || user.role === "admin"}
                readOnly={user.role === "admin"}
              />
              <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border text-sm font-semibold hover:bg-white/5 transition cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text2)" }}
            >
              {tr("Cancel")}
            </button>
            <button
              type="submit"
              disabled={saving || isUploadingImage}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
            >
              {saving || isUploadingImage ? (
                <>
                  <span className="animate-spin text-sm">🔄</span>
                  <span>{isUploadingImage ? tr("Uploading Image...") : tr("Updating...")}</span>
                </>
              ) : (
                <>
                  <FiCheck className="text-base" />
                  <span>{tr("Update Profile")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
