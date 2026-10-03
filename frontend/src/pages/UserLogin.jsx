// src/pages/UserLogin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

export default function UserLogin() {
  const nav = useNavigate();
  const { user, login } = useUser();
  const { tr } = useTheme();
  const [form, setForm]         = useState({ email: "", password: "" });
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === "admin") nav("/admin", { replace: true });
      else nav("/", { replace: true });
    }
  }, [user, nav]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error(tr("Please fill all fields")); return; }
    setLoading(true);
    try {
      const { data } = await API.post("/auth/login", form);
      login(data.token, data.user, remember);
      if (data.user.role === "admin") {
        toast.success(`Welcome Admin, ${data.user.firstName}!`);
        nav("/admin");
      } else {
        toast.success(`${tr("Welcome back")}, ${data.user.firstName}!`);
        nav("/");
      }
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Login failed"));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl" style={{ background: "var(--blob1)" }} />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-3xl" style={{ background: "var(--blob2)" }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="flex justify-center mb-8 cursor-pointer" onClick={() => nav("/")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xl">🚛</div>
            <div>
              <p className="text-lg font-bold" style={{ color: "var(--text)" }}>Sri Amman Transport</p>
              <p className="text-xs" style={{ color: "var(--text3)" }}>சேலம் போக்குவரத்து</p>
            </div>
          </div>
        </div>

        <div className="glass p-8">
          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>{tr("Sign In")}</h2>
          <p className="text-sm mb-7" style={{ color: "var(--text3)" }}>{tr("Access your transport dashboard")}</p>

          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>{tr("Email")}</label>
          <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />

          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: "var(--text3)" }}>{tr("Password")}</label>
          <div className="relative mb-4">
            <input
              className="input !mb-0 pr-14"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text3)" }}>
              {showPass ? tr("Hide") : tr("Show")}
            </button>
          </div>

          <div className="flex justify-between items-center mb-6 mt-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text2)" }}>
              <input type="checkbox" checked={remember} onChange={() => setRemember((v) => !v)} className="w-4 h-4 accent-blue-500" />
              {tr("Remember me")}
            </label>
            <span className="text-sm text-blue-500 hover:text-blue-400 cursor-pointer" onClick={() => toast.info("Password reset coming soon")}>
              {tr("Forgot password?")}
            </span>
          </div>

          <button onClick={handleLogin} disabled={loading} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? tr("Signing in…") : tr("Sign In")}
          </button>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text3)" }}>
            {tr("New here?")}{" "}
            <span onClick={() => nav("/register")} className="text-blue-500 hover:text-blue-400 cursor-pointer font-medium">{tr("Create account")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
