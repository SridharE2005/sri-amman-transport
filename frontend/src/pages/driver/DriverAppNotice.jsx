// src/pages/driver/DriverAppNotice.jsx
import { useNavigate } from "react-router-dom";
import { FiSmartphone, FiArrowLeft, FiShield } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";

export default function DriverAppNotice() {
  const navigate = useNavigate();
  const { tr } = useTheme();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-40"
          style={{ background: "var(--blob1)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-40"
          style={{ background: "var(--blob2)" }}
        />
      </div>

      <div className="glass max-w-lg w-full p-8 rounded-3xl border shadow-2xl relative z-10 text-center animate-fade-up" style={{ borderColor: "var(--border)" }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-violet-500/25 mb-6">
          <FiSmartphone />
        </div>

        <span className="text-xs font-black uppercase tracking-wider text-violet-500 bg-violet-500/10 px-3.5 py-1.5 rounded-full border border-violet-500/20">
          Mobile App Required
        </span>

        <h1 className="text-2xl sm:text-3xl font-black mt-4 mb-2 tracking-tight" style={{ color: "var(--text)" }}>
          Driver Portal Has Moved to Mobile App
        </h1>

        <p className="text-sm font-medium leading-relaxed mb-6" style={{ color: "var(--text3)" }}>
          To enable continuous background GPS location tracking, shift check-ins, and accurate telemetry for Sri Amman Transport, drivers must now use the dedicated <b>React Native Driver Mobile App</b>.
        </p>

        <div className="p-4 rounded-2xl border text-left space-y-2.5 mb-6" style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2.5 text-xs font-semibold" style={{ color: "var(--text)" }}>
            <span className="text-emerald-500">✓</span>
            <span>Uninterrupted 24/7 background GPS tracking</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold" style={{ color: "var(--text)" }}>
            <span className="text-emerald-500">✓</span>
            <span>Dedicated Shift Check-In & Check-Out</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold" style={{ color: "var(--text)" }}>
            <span className="text-emerald-500">✓</span>
            <span>Real-time Socket.IO telemetry to Admin</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold cursor-pointer"
        >
          <FiArrowLeft />
          <span>{tr("Back to Main Website")}</span>
        </button>
      </div>
    </div>
  );
}
