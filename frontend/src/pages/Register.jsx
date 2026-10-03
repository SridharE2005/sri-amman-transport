// src/pages/Register.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";
import AvatarSelector from "../components/AvatarSelector";
import { DEFAULT_AVATARS } from "../utils/defaultAvatars";
import { uploadImages } from "../services/imageUpload";

const rules = [
  { key: "length",    test: (p) => p.length >= 8,        label: "At least 8 characters" },
  { key: "uppercase", test: (p) => /[A-Z]/.test(p),      label: "Uppercase letter" },
  { key: "lowercase", test: (p) => /[a-z]/.test(p),      label: "Lowercase letter" },
  { key: "number",    test: (p) => /\d/.test(p),          label: "Numeric digit" },
  { key: "symbol",    test: (p) => /[!@#$%^&*]/.test(p), label: "Special symbol (!@#$%^&*)" },
];

export default function Register() {
  const nav = useNavigate();
  const { tr } = useTheme();

  // Form State
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  // Avatar Selection State (first avatar selected by default)
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(DEFAULT_AVATARS[0].url);
  const [customFile, setCustomFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const criteria = useMemo(() => {
    const p = form.password;
    return Object.fromEntries(rules.map(({ key, test }) => [key, test(p)]));
  }, [form.password]);

  const allValid = Object.values(criteria).every(Boolean);

  const handleSelectAvatar = (url, file) => {
    setSelectedAvatarUrl(url);
    setCustomFile(file);
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    return /^\+?[0-9]{10,13}$/.test(cleaned);
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegister = async () => {
    // 1. Basic validation
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phoneNumber.trim() || !form.password) {
      toast.error(tr("Please fill all required fields"));
      return;
    }

    if (!validateEmail(form.email.trim())) {
      toast.error(tr("Please enter a valid email address"));
      return;
    }

    if (!validatePhone(form.phoneNumber)) {
      toast.error(tr("Please enter a valid 10-digit phone number"));
      return;
    }

    if (!allValid) {
      toast.error(tr("Password does not meet security requirements"));
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error(tr("Passwords do not match"));
      return;
    }

    setLoading(true);

    try {
      let finalAvatarUrl = selectedAvatarUrl;
      let avatarType = "default";

      // 2. If user selected a custom file, upload directly to Cloudinary
      if (customFile) {
        setIsUploadingImage(true);
        try {
          const uploadRes = await uploadImages([customFile], "user-profiles");
          if (uploadRes?.[0]?.url) {
            finalAvatarUrl = uploadRes[0].url;
            avatarType = "custom";
          }
        } catch (uploadErr) {
          toast.error(tr(uploadErr.message || "Failed to upload custom profile image to Cloudinary"));
          setLoading(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // 3. Send OTP to user's email
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        password: form.password,
        profileImage: finalAvatarUrl,
        avatarType,
      };

      await API.post("/auth/send-otp", { email: payload.email });
      toast.success(tr("OTP sent to your email"));
      nav("/verify", { state: payload });
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--bg)" }}>
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(16,185,129,0.10)" }} />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(20,184,166,0.08)" }} />
      </div>

      <div className="relative w-full max-w-lg animate-fade-up">
        {/* Brand Header */}
        <div className="flex justify-center mb-6 cursor-pointer" onClick={() => nav("/")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl shadow-md">🚛</div>
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Sri Amman Transport</p>
              <p className="text-xs" style={{ color: "var(--text3)" }}>சேலம் போக்குவரத்து</p>
            </div>
          </div>
        </div>

        <div className="glass p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Create Account</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text3)" }}>Join Sri Amman Transport with OTP verification</p>

          {/* 1. Profile Avatar Selection Component */}
          <AvatarSelector
            selectedUrl={selectedAvatarUrl}
            customFile={customFile}
            onSelectAvatar={handleSelectAvatar}
            isUploading={isUploadingImage}
            accentColor="emerald"
          />

          {/* 2. Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                First Name *
              </label>
              <input
                className="input !mb-0"
                placeholder="Rajan"
                value={form.firstName}
                onChange={set("firstName")}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                Last Name *
              </label>
              <input
                className="input !mb-0"
                placeholder="Kumar"
                value={form.lastName}
                onChange={set("lastName")}
                disabled={loading}
              />
            </div>
          </div>

          {/* 3. Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                Email Address *
              </label>
              <input
                className="input !mb-0"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                Phone Number *
              </label>
              <input
                className="input !mb-0"
                type="tel"
                placeholder="9876543210"
                value={form.phoneNumber}
                onChange={set("phoneNumber")}
                disabled={loading}
              />
            </div>
          </div>

          {/* 4. Password */}
          <div className="mb-3">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Password *
            </label>
            <div className="relative">
              <input
                className="input !mb-0 pr-14"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={set("password")}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium cursor-pointer"
                style={{ color: "var(--text3)" }}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Password Criteria Checklist */}
          {form.password && (
            <div className="mb-3 p-3 rounded-xl grid grid-cols-2 gap-1.5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {rules.map(({ key, label }) => (
                <p key={key} className={`check-item text-xs ${criteria[key] ? "text-emerald-500 font-medium" : ""}`} style={!criteria[key] ? { color: "var(--text3)" } : {}}>
                  <span>{criteria[key] ? "✔" : "○"}</span> {tr(label)}
                </p>
              ))}
            </div>
          )}

          {/* 5. Confirm Password */}
          <div className="mb-5">
            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              Confirm Password *
            </label>
            <div className="relative">
              <input
                className={`input !mb-0 pr-14 ${
                  form.confirmPassword && form.password !== form.confirmPassword ? "border-rose-500" : ""
                }`}
                type={showConfirmPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium cursor-pointer"
                style={{ color: "var(--text3)" }}
              >
                {showConfirmPass ? "Hide" : "Show"}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-rose-400 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleRegister}
            disabled={loading || isUploadingImage}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-500/20 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {loading || isUploadingImage ? (
              <>
                <span className="animate-spin">🔄</span>
                <span>{isUploadingImage ? "Uploading Avatar..." : "Sending OTP..."}</span>
              </>
            ) : (
              <span>Continue with OTP →</span>
            )}
          </button>

          <p className="text-center text-sm mt-5" style={{ color: "var(--text3)" }}>
            Already have an account?{" "}
            <span onClick={() => nav("/user-login")} className="text-blue-500 hover:text-blue-400 cursor-pointer font-medium">
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
