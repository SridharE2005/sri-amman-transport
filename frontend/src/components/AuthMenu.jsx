// src/components/AuthMenu.jsx
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function AuthMenu({ onClose }) {
  const nav = useNavigate();
  const { t } = useTheme();

  const items = [
    { icon: "👤", label: t.login,    path: "/login" },
    { icon: "✨", label: t.register, path: "/register" },
  ];

  const go = (path) => { onClose?.(); nav(path); };

  return (
    <div className="auth-popup" onMouseEnter={(e) => e.stopPropagation()}>
      <p className="text-xs font-semibold uppercase tracking-widest px-3 py-2" style={{ color: "var(--text3)" }}>
        Account
      </p>
      {items.map(({ icon, label, path }) => (
        <button
          key={path}
          onClick={() => go(path)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 hover:bg-blue-500/10"
          style={{ color: "var(--text2)" }}
        >
          <span>{icon}</span> {label}
        </button>
      ))}
    </div>
  );
}
