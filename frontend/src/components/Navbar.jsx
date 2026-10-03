// src/components/Navbar.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthMenu from "./AuthMenu";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/main-logo.png";
import { FiLogOut, FiClock, FiChevronRight, FiShield } from "react-icons/fi";

export default function Navbar() {
  const nav = useNavigate();
  const location = useLocation();
  const { user, logout } = useUser();
  const { theme, toggleTheme, lang, toggleLang, t } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const links = [
    { label: t.home,     path: "/" },
    { label: t.about,    path: "/#about" },
    { label: t.stats,    path: "/#stats" },
    { label: t.services, path: "/#services" },
    { label: t.contact,  path: "/#contact" },
  ];

  const handleLogout = () => { logout(); nav("/"); setMenuOpen(false); };

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;
    requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    });
  }, [location.pathname, location.hash]);

  const navigateTo = (path) => {
    const hash = path.split("#")[1];
    setMenuOpen(false);
    if (hash) {
      if (location.pathname !== "/") {
        nav(path);
      } else {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", path);
      }
      return;
    }
    nav(path);
  };

  const renderNotificationButton = (mobile = false) => (
    <button
      onClick={() => { nav("/notifications"); setMenuOpen(false); }}
      title="Notifications"
      aria-label="Notifications"
      className={`${mobile ? "w-full justify-between px-4" : "w-10"} h-9 rounded-xl flex items-center gap-2 ${mobile ? "" : "justify-center"} text-lg border transition`}
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }}
    >
      <span>💬</span>
      {mobile && <span className="text-sm font-semibold">Notifications</span>}
    </button>
  );

  const renderLanguageButton = (mobile = false) => {
    if (mobile) {
      return (
        <button
          onClick={toggleLang}
          title="Switch Language"
          className="w-full flex items-center justify-between px-4 h-10 rounded-xl border transition hover:bg-blue-500/10"
          style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{lang === "en" ? "🇮🇳" : "🇬🇧"}</span>
            <span className="text-sm font-semibold">{lang === "en" ? "தமிழ் (Tamil)" : "English"}</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-500">
            {lang === "en" ? "மாற்று" : "Switch"}
          </span>
        </button>
      );
    }
    return (
      <button
        onClick={toggleLang}
        title="Switch Language"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }}
      >
        <span className="text-base">{lang === "en" ? "🇮🇳" : "🇬🇧"}</span>
        {lang === "en" ? "தமிழ்" : "EN"}
      </button>
    );
  };

  const renderThemeButton = (mobile = false) => (
    <button
      onClick={toggleTheme}
      title="Toggle theme"
      className={`${mobile ? "w-full justify-between px-4 h-10" : "w-9 h-9 justify-center"} rounded-xl flex items-center gap-2 text-lg border transition hover:bg-blue-500/10`}
      style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }}
    >
      <div className="flex items-center gap-2.5">
        <span>{theme === "dark" ? "☀️" : "🌙"}</span>
        {mobile && <span className="text-sm font-semibold" style={{ color: "var(--text2)" }}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
      </div>
      {mobile && <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-500">{theme === "dark" ? "Light" : "Dark"}</span>}
    </button>
  );

  return (
    <>
      <nav className="sticky top-0 z-50 w-full nav-bg backdrop-blur-xl shadow-sm" style={{ borderBottom: "1px solid var(--border)", position: "sticky", top: 0 }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex justify-between items-center gap-2 sm:gap-4 min-w-0">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => nav("/")}>
            <img src={logo} alt="Sri Amman Transport logo" className="w-10 h-10 object-contain rounded-lg shrink-0" />
            <div className="min-w-0">
              <span className="block truncate text-sm sm:text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>Sri Amman Transport</span>
              <p className="text-[10px] sm:text-xs leading-none truncate" style={{ color: "var(--text3)" }}>ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட்</p>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-6">
            {links.map(({ label, path }) => (
              <span key={path} className="nav-link text-sm" onClick={() => navigateTo(path)}>{label}</span>
            ))}
          </div>

          {/* Desktop right controls */}
          <div className="hidden md:flex items-center gap-2">
            {renderLanguageButton()}
            {renderThemeButton()}
            {user ? (
              <>
                {user.role !== "admin" && (
                  <button
                    onClick={() => nav("/booking-history")}
                    title={lang === "en" ? "My Booking History" : "எனது முன்பதிவு வரலாறு"}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer text-xs font-semibold ${
                      location.pathname === "/booking-history"
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400"
                        : "hover:border-blue-500/50 hover:bg-blue-500/10"
                    }`}
                    style={
                      location.pathname !== "/booking-history"
                        ? { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }
                        : {}
                    }
                  >
                    <FiClock className="text-sm text-blue-500 flex-shrink-0" />
                    <span>{lang === "en" ? "History" : "வரலாறு"}</span>
                  </button>
                )}
                {user.role !== "admin" && renderNotificationButton()}
                {user.role === "admin" && (
                  <button
                    onClick={() => nav("/admin")}
                    title="Open Admin Dashboard"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 text-xs font-bold transition cursor-pointer"
                  >
                    <FiShield className="text-sm" />
                    <span>Admin Panel</span>
                  </button>
                )}
                <button
                  onClick={() => nav("/profile")}
                  title="Open profile"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition hover:border-blue-500/50 cursor-pointer"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-xs">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.firstName?.[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--text2)" }}>{user.firstName}</span>
                  {user.role === "admin" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-500 border border-violet-500/20">Admin</span>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  title={t.logout || "Logout"}
                  aria-label={t.logout || "Logout"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-xs font-semibold cursor-pointer"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }}
                >
                  <FiLogOut className="text-sm" />
                  <span>{t.logout || "Logout"}</span>
                </button>
              </>
            ) : (
              <div className="relative" onMouseEnter={() => setAuthOpen(true)} onMouseLeave={() => setAuthOpen(false)}>
                <button
                  onClick={() => nav("/login")}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/20"
                >
                  {t.login}
                </button>
                {authOpen && <AuthMenu onClose={() => setAuthOpen(false)} />}
              </div>
            )}
          </div>

          {/* Mobile: controls + hamburger (language removed to avoid title overflow) */}
          <div className="md:hidden flex items-center gap-2">
            {user && user.role !== "admin" && renderNotificationButton()}
            <button
              className="flex flex-col gap-1.5 p-2 rounded-lg transition"
              style={{ background: menuOpen ? "var(--surface)" : "transparent" }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} style={{ background: "var(--text)" }} />
              <span className={`block w-5 h-0.5 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} style={{ background: "var(--text)" }} />
              <span className={`block w-5 h-0.5 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} style={{ background: "var(--text)" }} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${menuOpen ? "visible" : "invisible"}`}>
        <div className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-72 drawer-bg p-6 flex flex-col gap-1 transition-transform duration-300 ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex flex-col items-center gap-2 pb-5 mb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <img src={logo} alt="Sri Amman Transport logo" className="w-12 h-12 object-contain rounded-lg" />
            <p className="text-sm font-bold text-center" style={{ color: "var(--text)" }}>Sri Amman Transport</p>
          </div>

          {links.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigateTo(path)}
              className="text-left px-4 py-3 rounded-xl transition text-sm font-medium hover:bg-blue-500/10"
              style={{ color: "var(--text2)" }}
            >
              {label}
            </button>
          ))}

          {user && user.role !== "admin" && (
            <div className="flex flex-col gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              {renderNotificationButton(true)}
            </div>
          )}

          {user && (
            <div className="flex flex-col gap-1 mt-1">
              {user.role === "admin" ? (
                <button
                  onClick={() => { nav("/admin"); setMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium hover:bg-violet-500/10 transition"
                  style={{ color: "var(--text2)" }}
                >
                  <div className="flex items-center gap-3">
                    <FiShield className="text-base text-violet-500" />
                    <span>Admin Panel</span>
                  </div>
                  <FiChevronRight className="text-sm opacity-50" />
                </button>
              ) : (
                <button
                  onClick={() => { nav("/booking-history"); setMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm font-medium hover:bg-blue-500/10 transition"
                  style={{ color: "var(--text2)" }}
                >
                  <div className="flex items-center gap-3">
                    <FiClock className="text-base text-blue-500" />
                    <span>{lang === "en" ? "History" : "முன்பதிவு வரலாறு"}</span>
                  </div>
                  <FiChevronRight className="text-sm opacity-50" />
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
            {renderLanguageButton(true)}
            {renderThemeButton(true)}
          </div>

          <div className="mt-auto pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            {user ? (
              <>
                <div
                  onClick={() => {
                    nav("/profile");
                    setMenuOpen(false);
                  }}
                  className="flex items-center justify-between mb-3 p-2.5 rounded-xl cursor-pointer transition hover:bg-blue-500/10 active:scale-[0.99] border group"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  title="View Profile"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm overflow-hidden">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        user.firstName?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate group-hover:text-blue-500 transition-colors" style={{ color: "var(--text)" }}>
                          {user.firstName} {user.lastName}
                        </p>
                        {user.role === "admin" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-500 border border-violet-500/20">Admin</span>
                        )}
                      </div>
                      <p className="text-xs truncate" style={{ color: "var(--text3)" }}>{user.email}</p>
                    </div>
                  </div>
                  <FiChevronRight className="text-sm shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: "var(--text3)" }} />
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/40"
                  style={{ borderColor: "var(--border)", color: "var(--text3)" }}
                >
                  <FiLogOut className="text-sm" />
                  <span>{t.logout}</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => { nav("/login"); setMenuOpen(false); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/20">
                  {t.login}
                </button>
                <button onClick={() => { nav("/register"); setMenuOpen(false); }} className="w-full py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>
                  {t.register}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
