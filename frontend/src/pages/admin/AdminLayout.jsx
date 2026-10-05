// src/pages/admin/AdminLayout.jsx
import { createElement, useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { useTheme } from "../../context/ThemeContext";
import API from "../../services/api";
import { toast } from "react-toastify";
import { FiArchive, FiBox, FiChevronRight, FiClipboard, FiLogOut, FiMessageSquare, FiPieChart, FiStar, FiTruck } from "react-icons/fi";
import logo from "../../assets/main-logo.png";

const NAV = [
  { to: "/admin",          icon: FiPieChart,      label: "Dashboard", end: true },
  { to: "/admin/goods",    icon: FiBox,           label: "Add Goods"          },
  { to: "/admin/bookings", icon: FiClipboard,     label: "Bookings"           },
  { to: "/admin/history",  icon: FiArchive,       label: "History"            },
  { to: "/admin/ratings",  icon: FiStar,          label: "Ratings"            },
  { to: "/admin/messages", icon: FiMessageSquare, label: "Messages"           },
  { to: "/admin/drivers",  icon: FiTruck,         label: "Drivers"            },
];

export default function AdminLayout() {
  const { user, loading, logout } = useUser();
  const { theme, toggleTheme, tr } = useTheme();
  const nav = useNavigate();
  const location = useLocation();
  const [sideOpen, setSideOpen] = useState(false);

  // Live badge alert counters
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingCancellations, setPendingCancellations] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);

  const fetchBadgeCounts = async () => {
    if (!user || user.role !== "admin") return;
    try {
      const [msgRes, cancelRes, bookRes] = await Promise.all([
        API.get("/messages").catch(() => ({ data: [] })),
        API.get("/bookings/cancellation-requests?status=PENDING").catch(() => ({ data: [] })),
        API.get("/bookings").catch(() => ({ data: [] })),
      ]);
      const msgs = msgRes.data || [];
      const cancels = cancelRes.data || [];
      const books = bookRes.data || [];

      const isMessagesPage = location.pathname.startsWith("/admin/messages");
      const isBookingsPage = location.pathname.startsWith("/admin/bookings");

      const lastViewedMsgs = Number(localStorage.getItem("admin_last_viewed_messages") || 0);
      const lastViewedCancels = Number(localStorage.getItem("admin_last_viewed_cancellations") || 0);
      const lastViewedBooks = Number(localStorage.getItem("admin_last_viewed_bookings") || 0);

      const unreadMsgsCount = isMessagesPage
        ? 0
        : msgs.filter((m) => !m.read && new Date(m.createdAt).getTime() > lastViewedMsgs).length;

      const unreadCancelsCount = isMessagesPage
        ? 0
        : cancels.filter((c) => new Date(c.requestedAt || c.createdAt).getTime() > lastViewedCancels).length;

      const unreadBooksCount = isBookingsPage
        ? 0
        : books.filter(
            (b) =>
              (b.status === "Pending" || b.status === "PENDING") &&
              new Date(b.createdAt || b.updatedAt).getTime() > lastViewedBooks
          ).length;

      setUnreadMessages(unreadMsgsCount);
      setPendingCancellations(unreadCancelsCount);
      setPendingBookings(unreadBooksCount);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (location.pathname.startsWith("/admin/messages")) {
      try {
        localStorage.setItem("admin_last_viewed_messages", Date.now().toString());
        localStorage.setItem("admin_last_viewed_cancellations", Date.now().toString());
      } catch {}
      setUnreadMessages(0);
      setPendingCancellations(0);
    }
    if (location.pathname.startsWith("/admin/bookings")) {
      try {
        localStorage.setItem("admin_last_viewed_bookings", Date.now().toString());
      } catch {}
      setPendingBookings(0);
    }

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 15000);

    const onBadgesUpdated = () => fetchBadgeCounts();
    window.addEventListener("admin_badges_updated", onBadgesUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("admin_badges_updated", onBadgesUpdated);
    };
  }, [user, location.pathname]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Please login to access the admin portal");
        nav("/login", { replace: true });
      } else if (user.role !== "admin") {
        toast.error("Access denied. Admin privileges required.");
        if (user.role === "driver") {
          nav("/driver/dashboard", { replace: true });
        } else {
          nav("/", { replace: true });
        }
      }
    }
  }, [user, loading, nav]);

  if (loading || !user || user.role !== "admin") return null;

  const handleLogout = () => { logout(); nav("/login"); };

  const totalMessageAlerts = unreadMessages + pendingCancellations;
  const totalAdminAlerts = totalMessageAlerts + pendingBookings;

  const renderSideContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 mb-2" style={{ borderBottom: "1px solid var(--border)" }}>
      <img src={logo} alt="Sri Amman Transport logo" className="w-10 h-10 rounded-lg object-contain flex-shrink-0" />
        <div>
          <p className="font-bold text-sm" style={{ color: "var(--text)" }}>Sri Amman Transport</p>
          <p className="text-xs" style={{ color: "var(--text3)" }}>Management Panel</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, icon, label, end }) => {
          let badge = null;
          if (to === "/admin/bookings" && pendingBookings > 0) {
            badge = (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-xs">
                {pendingBookings}
              </span>
            );
          } else if (to === "/admin/messages" && totalMessageAlerts > 0) {
            badge = (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-500 text-white shadow-xs animate-pulse">
                {totalMessageAlerts}
              </span>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSideOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-violet-500/15 text-violet-500 border border-violet-500/20"
                    : "hover:bg-white/5"
                }`
              }
              style={({ isActive }) => ({ color: isActive ? undefined : "var(--text2)" })}
            >
              {createElement(icon, { className: "text-lg", "aria-hidden": true })}
              <span>{tr(label)}</span>
              {badge}
            </NavLink>
          );
        })}
      </nav>


      {/* Bottom */}
      <div className="px-3 pb-5 space-y-2" style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
        <button
          type="button"
          onClick={() => { nav("/profile"); setSideOpen(false); }}
          title={tr("Admin Profile")}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200 hover:border-violet-500/50 hover:bg-white/5 cursor-pointer text-left group"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                user.firstName?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-violet-400 transition-colors" style={{ color: "var(--text)" }}>
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text3)" }}>{user.email}</p>
            </div>
          </div>
          <FiChevronRight className="text-base text-gray-400 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition hover:bg-white/5"
          style={{ color: "var(--text3)" }}
        >
          <span className="text-lg">{theme === "dark" ? "☀️" : "🌙"}</span> {tr("Change theme")}
        </button>
        <button
          onClick={() => { nav("/"); setSideOpen(false); }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition hover:bg-white/5"
          style={{ color: "var(--text3)" }}
        >
          <span className="text-lg">↩</span> {tr("Go to site")}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition hover:bg-red-500/10 hover:text-red-400"
          style={{ color: "var(--text3)" }}
        >
          <FiLogOut className="text-lg" aria-hidden="true" /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen min-h-0 overflow-hidden" style={{ background: "var(--bg)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-64 flex-shrink-0 flex-col" style={{ background: "var(--bg3)", borderRight: "1px solid var(--border)" }}>
        {renderSideContent()}
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSideOpen(false)} />
          <aside className="absolute right-0 top-0 z-50 flex flex-col w-72 h-full" style={{ background: "var(--bg3)", borderLeft: "1px solid var(--border)" }}>
            {renderSideContent()}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="md:sticky md:top-0 relative z-30 flex items-center justify-between px-4 sm:px-6 py-3.5" style={{ background: "var(--nav-bg)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(16px)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Sri Amman Transport logo" className="w-9 h-9 rounded-lg object-contain" />
              <h1 className="text-sm font-bold sm:text-base truncate" style={{ color: "var(--text)" }}>Sri Amman Transport</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Admin Profile Quick Access */}
            <button
              onClick={() => nav("/profile")}
              title={tr("Admin Profile")}
              className="hidden md:flex items-center gap-2 h-9 px-3 rounded-xl border transition-all duration-200 hover:border-violet-500/50 hover:bg-white/5 cursor-pointer"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-xs overflow-hidden">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.firstName?.[0]?.toUpperCase()
                )}
              </div>
              <span className="text-xs font-medium max-w-[120px] truncate" style={{ color: "var(--text2)" }}>
                {user.firstName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 font-semibold">
                Admin
              </span>
            </button>

            <button
              className="relative md:hidden p-2 rounded-lg hover:bg-white/5 transition order-last"
              onClick={() => setSideOpen(true)}
              aria-label="Open navigation"
            >
              <span className="block w-5 h-0.5 mb-1" style={{ background: "var(--text)" }} />
              <span className="block w-5 h-0.5 mb-1" style={{ background: "var(--text)" }} />
              <span className="block w-5 h-0.5" style={{ background: "var(--text)" }} />
              {totalAdminAlerts > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                  {totalAdminAlerts}
                </span>
              )}
            </button>
            <button
              className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center text-lg border transition"
              onClick={toggleTheme}
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              className="hidden md:flex h-9 items-center rounded-xl border px-3 text-xs font-bold transition hover:bg-red-500/10 hover:text-red-400"
              onClick={handleLogout}
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text2)" }}
            >
              {tr("Logout")}
            </button>
            <button onClick={() => nav("/")} className="px-3 py-1.5 rounded-xl text-xs border transition hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--text3)" }}>
              ← Site
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
