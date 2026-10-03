// src/pages/VerifyOtp.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function VerifyOtp() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { tr } = useTheme();
  const [otp, setOtp]         = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state?.email || !state?.password || !state?.firstName || !state?.lastName) {
      toast.error(tr("Please start with registration first."));
      nav("/register");
    }
  }, [state, nav]);

  const verify = async () => {
    if (!otp.trim()) { toast.error(tr("Please enter OTP")); return; }
    setLoading(true);
    try {
      await API.post("/auth/verify-otp", { ...state, otp });
      toast.success(tr("Account created! Redirecting to login…"));
      nav("/user-login");
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Verification failed"));
    } finally { setLoading(false); }
  };

  const resend = async () => {
    if (!state?.email) { toast.error(tr("Email not found")); return; }
    setLoading(true);
    try {
      await API.post("/auth/send-otp", { email: state.email });
      toast.success(tr("OTP resent successfully"));
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to resend OTP"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--blob1)" }} />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="flex justify-center mb-8">
          {state?.profileImage ? (
            <img src={state.profileImage} alt="User Avatar" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-lg shadow-emerald-500/20" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/30">✉️</div>
          )}
        </div>

        <div className="glass p-8 text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>{tr("Check your email")}</h2>
          <p className="text-sm mb-1" style={{ color: "var(--text3)" }}>{tr("We sent a 6-digit code to")}</p>
          <p className="text-blue-500 font-medium text-sm mb-8">{state?.email || "your email"}</p>

          <input
            className="w-full px-4 py-4 rounded-xl mb-6 text-center text-3xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }}
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />

          <button
            onClick={verify}
            disabled={loading || otp.length < 6}
            className="btn-primary mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? tr("Verifying…") : tr("Verify & Create Account")}
          </button>

          <p className="text-sm" style={{ color: "var(--text3)" }}>
            {tr("Didn't receive it?")}{" "}
            <span onClick={resend} className="text-blue-500 hover:text-blue-400 cursor-pointer font-medium">{tr("Resend OTP")}</span>
          </p>

          <p className="mt-6 text-xs">
            <span onClick={() => nav("/register")} className="cursor-pointer hover:text-blue-400 transition" style={{ color: "var(--text3)" }}>{tr("Back to Register")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
