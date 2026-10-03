import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";
import API from "../services/api";
import FeedbackModal from "../components/FeedbackModal";
import CancelBookingModal from "../components/CancelBookingModal";
import RequestCancellationModal from "../components/RequestCancellationModal";
import { getCancellationInfo } from "../utils/cancellationHelper";
import {
  FiMapPin,
  FiPhone,
  FiCopy,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiTruck,
  FiArrowRight,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

const MATERIAL_ICON = {
  Bricks: "🧱",
  "M-Sand": "🏗️",
  "River Sand": "🏖️",
  "Dry Grass Rolls": "🌾",
};

const statusConfig = {
  Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  PENDING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  CONFIRMED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  REJECTED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  Revoked: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Delivered: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  CANCELLED_BY_USER: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  CANCELLED_BY_ADMIN: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const getStatusLabel = (status, tr) => {
  if (status === "Delivered") return tr("Successfully Delivered");
  if (status === "CANCELLED_BY_USER") return tr("Cancelled by You");
  if (status === "CANCELLED_BY_ADMIN") return tr("Cancelled by Admin");
  return tr(status);
};

const getDaysAgo = (dateStr, tr) => {
  if (!dateStr) return "";
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  if (diffMs < 0) return tr ? tr("Just now") : "Just now";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) {
    if (diffHours === 0) {
      if (diffMins <= 1) return tr ? tr("Just now") : "Just now";
      return `${diffMins}m ${tr ? tr("ago") : "ago"}`;
    }
    return `${diffHours}h ${tr ? tr("ago") : "ago"}`;
  }
  if (diffDays === 1) return `1 ${tr ? tr("day ago") : "day ago"}`;
  if (diffDays < 30) return `${diffDays} ${tr ? tr("days ago") : "days ago"}`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return `1 ${tr ? tr("month ago") : "month ago"}`;
  return `${diffMonths} ${tr ? tr("months ago") : "months ago"}`;
};

const getMessage = (booking, tr) => {
  if (booking.status === "Confirmed" || booking.status === "CONFIRMED")
    return tr("Approved by admin.");
  if (booking.status === "Delivered") return tr("Successfully delivered.");
  if (booking.status === "Rejected" || booking.status === "REJECTED")
    return `${tr("Rejected")}: ${booking.rejectionReason || tr("No reason provided")}`;
  if (booking.status === "Revoked")
    return `${tr("Cancelled")}: ${booking.revokedReason || tr("No reason provided")}`;
  if (booking.status === "CANCELLED_BY_USER")
    return `${tr("Cancelled by you")}: ${booking.cancellationReason || tr("No reason provided")}`;
  if (booking.status === "CANCELLED_BY_ADMIN")
    return `${tr("Cancelled by admin")}: ${booking.cancellationReason || tr("No reason provided")}`;
  return tr("Waiting for admin approval.");
};

export default function BookingHistory() {
  const { user, loading } = useUser();
  const { tr } = useTheme();
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [feedbackIds, setFeedbackIds] = useState([]);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [requestModalBooking, setRequestModalBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  // Server-side pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) nav("/user-login");
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    Promise.all([
      API.get(`/bookings/my?page=${page}&limit=${limit}`),
      API.get("/feedback/my"),
    ])
      .then(([bookingsResponse, feedbackResponse]) => {
        const payload = bookingsResponse.data;
        if (Array.isArray(payload)) {
          setBookings(payload);
          setTotalCount(payload.length);
          setTotalPages(1);
        } else {
          setBookings(payload.data || []);
          setTotalCount(payload.total || 0);
          setTotalPages(payload.totalPages || 1);
        }
        const fbData = Array.isArray(feedbackResponse.data) ? feedbackResponse.data : [];
        setFeedbackIds(fbData.map((item) => String(item.booking)));
      })
      .catch(() => toast.error(tr("Failed to load booking history")))
      .finally(() => setFetching(false));
  }, [user, page, limit]);

  // Live timer tick for real-time 24h countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openDetailModal = (b) => {
    setSelectedBooking(b);
    window.history.pushState({ userBookingDetailModal: true, id: b._id }, "");
  };

  const closeDetailModal = () => {
    if (window.history.state?.userBookingDetailModal) {
      window.history.back();
    } else {
      setSelectedBooking(null);
    }
  };

  // Intercept back navigation to dismiss popup modal without route change
  useEffect(() => {
    const handlePopState = () => {
      setSelectedBooking(null);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const handleBookingCancelled = (updatedBooking) => {
    setBookings((current) =>
      current.map((b) => (b._id === updatedBooking._id ? { ...b, ...updatedBooking } : b))
    );
    setSelectedBooking((current) =>
      current && current._id === updatedBooking._id ? { ...current, ...updatedBooking } : current
    );
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-tag">{tr("Your account")}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--text)" }}>
              {tr("Booking History")}
            </h1>
            <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text3)" }}>
              {tr("Track every booking, live cancellation window, and admin decision.")}
            </p>
          </div>
          <button
            onClick={() => nav("/stocks")}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold shadow-md shadow-blue-500/20 hover:opacity-95 transition cursor-pointer"
          >
            <span>{tr("Book materials")}</span>
            <FiArrowRight />
          </button>
        </div>

        {fetching ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium" style={{ color: "var(--text3)" }}>
              {tr("Loading your bookings...")}
            </p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl">
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {tr("No bookings yet")}
            </p>
            <p className="text-sm mt-2" style={{ color: "var(--text3)" }}>
              {tr("Your booking history will appear here after you place an order.")}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile, visible on md and up) */}
            <div
              className="hidden md:block rounded-2xl border overflow-hidden shadow-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--border)", background: "var(--card, var(--bg3))" }}
                    >
                      <th
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider"
                        style={{ color: "var(--text3)" }}
                      >
                        {tr("Booking ID")}
                      </th>
                      <th
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider"
                        style={{ color: "var(--text3)" }}
                      >
                        {tr("Material & Title")}
                      </th>
                      <th
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider"
                        style={{ color: "var(--text3)" }}
                      >
                        {tr("Quantity & Price")}
                      </th>
                      <th
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider"
                        style={{ color: "var(--text3)" }}
                      >
                        {tr("Delivery Address")}
                      </th>
                      <th
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider"
                        style={{ color: "var(--text3)" }}
                      >
                        {tr("Date")}
                      </th>
                      <th
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider"
                        style={{ color: "var(--text3)" }}
                      >
                        {tr("Status")}
                      </th>
                      <th
                        className="py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-right"
                        style={{ color: "var(--text3)" }}
                      >
                        {tr("Action")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {bookings.map((booking) => {
                      const material = booking.goodsData?.material || "Material";
                      const title = booking.goodsData?.title || tr("Material booking");
                      const daysAgo = getDaysAgo(booking.createdAt, tr);
                      const bId =
                        booking.bookingId ||
                        (booking.booking && booking.booking.bookingId) ||
                        "—";
                      const dateFormatted = new Date(booking.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      );

                      return (
                        <tr
                          key={booking._id}
                          onClick={() => openDetailModal(booking)}
                          className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">
                            {bId}
                          </td>
                          <td className="py-3.5 px-4 min-w-[180px]">
                            <div className="flex items-center gap-2">
                              <span className="text-base">
                                {MATERIAL_ICON[material] || "📦"}
                              </span>
                              <div className="min-w-0">
                                <p
                                  className="font-bold text-sm leading-tight truncate max-w-[200px]"
                                  style={{ color: "var(--text)" }}
                                >
                                  {title}
                                </p>
                                <span
                                  className="text-[11px]"
                                  style={{ color: "var(--text3)" }}
                                >
                                  {tr(material)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className="font-bold text-xs"
                              style={{ color: "var(--text)" }}
                            >
                              {booking.orderQty}{" "}
                              {tr(
                                material === "Bricks"
                                  ? "bricks"
                                  : material === "Dry Grass Rolls"
                                  ? "rolls"
                                  : "units"
                              )}
                            </span>
                            {booking.estimatedAmount > 0 && (
                              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                ₹{booking.estimatedAmount.toLocaleString("en-IN")}
                              </p>
                            )}
                          </td>
                          <td
                            className="py-3.5 px-4 text-xs max-w-[200px] truncate"
                            style={{ color: "var(--text2)" }}
                          >
                            <span
                              className="flex items-center gap-1.5 truncate"
                              title={booking.deliveryAddress}
                            >
                              <FiMapPin className="text-blue-500 shrink-0 text-xs" />
                              <span className="truncate">{booking.deliveryAddress}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                            <p className="font-semibold text-violet-600 dark:text-violet-400">
                              {daysAgo}
                            </p>
                            <p style={{ color: "var(--text3)" }}>{dateFormatted}</p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                statusConfig[booking.status] ||
                                "bg-gray-500/10 text-gray-500 border-gray-500/20"
                              }`}
                            >
                              {getStatusLabel(booking.status, tr)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(booking);
                              }}
                              className="px-3 py-1.5 rounded-xl border text-xs font-semibold text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition cursor-pointer"
                            >
                              {tr("View Details")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (visible on mobile < md, hidden on desktop) */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {bookings.map((booking) => {
                const material = booking.goodsData?.material || "Material";
                const title = booking.goodsData?.title || tr("Material booking");
                const daysAgo = getDaysAgo(booking.createdAt, tr);
                const dateFormatted = new Date(booking.createdAt).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }
                );

                return (
                  <article
                    key={booking._id}
                    onClick={() => openDetailModal(booking)}
                    className="p-4 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:border-violet-500/40 cursor-pointer group active:scale-[0.99] flex flex-col justify-between"
                    style={{
                      background: "var(--card, var(--bg3))",
                      borderColor: "var(--border)",
                    }}
                  >
                    <div>
                      {/* Top Row: Material Badge & Status Badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          <span>{MATERIAL_ICON[material] || "📦"}</span>
                          <span>{tr(material)}</span>
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            statusConfig[booking.status] ||
                            "bg-gray-500/10 text-gray-500 border-gray-500/20"
                          }`}
                        >
                          {getStatusLabel(booking.status, tr)}
                        </span>
                      </div>

                      {/* Material Title */}
                      <h3
                        className="font-extrabold text-base leading-snug group-hover:text-violet-500 transition-colors"
                        style={{ color: "var(--text)" }}
                      >
                        {title}
                      </h3>

                      {/* Quick Metrics: Quantity & Total Amount */}
                      <div
                        className="mt-3 flex items-center justify-between text-xs py-2 px-3 rounded-xl border"
                        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                      >
                        <div>
                          <span style={{ color: "var(--text3)" }}>{tr("Quantity")}: </span>
                          <span className="font-bold" style={{ color: "var(--text)" }}>
                            {booking.orderQty}
                          </span>
                        </div>
                        {booking.estimatedAmount > 0 && (
                          <div>
                            <span style={{ color: "var(--text3)" }}>{tr("Total")}: </span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              ₹{booking.estimatedAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Days Ago & Formatted Date + View Details Link */}
                    <div
                      className="mt-3.5 pt-2.5 border-t flex items-center justify-between text-xs"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center gap-1.5" style={{ color: "var(--text3)" }}>
                        <FiClock className="text-violet-500 text-xs flex-shrink-0" />
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                          {daysAgo}
                        </span>
                        <span className="opacity-40">·</span>
                        <span>{dateFormatted}</span>
                      </div>
                      <span className="text-violet-600 dark:text-violet-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        {tr("View details")} →
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--text3)" }}>
                  {tr("Showing")}{" "}
                  <span className="font-bold" style={{ color: "var(--text)" }}>
                    {Math.min((page - 1) * limit + 1, totalCount)}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold" style={{ color: "var(--text)" }}>
                    {Math.min(page * limit, totalCount)}
                  </span>{" "}
                  {tr("of")}{" "}
                  <span className="font-bold" style={{ color: "var(--text)" }}>
                    {totalCount}
                  </span>{" "}
                  {tr("bookings")}
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (page > 1) {
                        setPage(page - 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <FiChevronLeft className="text-sm" />
                    <span className="hidden sm:inline">{tr("Previous")}</span>
                  </button>

                  {/* Page number buttons */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) {
                        acc.push("...");
                      }
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span
                          key={`dots-${idx}`}
                          className="px-2 text-xs"
                          style={{ color: "var(--text3)" }}
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => {
                            setPage(p);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition cursor-pointer ${
                            page === p
                              ? "bg-violet-600 text-white shadow-sm shadow-violet-500/30"
                              : "border hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                          style={
                            page === p
                              ? {}
                              : { borderColor: "var(--border)", color: "var(--text)" }
                          }
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => {
                      if (page < totalPages) {
                        setPage(page + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    <span className="hidden sm:inline">{tr("Next")}</span>
                    <FiChevronRight className="text-sm" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ======================================================== */}
      {/* FULL INFORMATION POPUP (Rendered via React Portal)        */}
      {/* ======================================================== */}
      {selectedBooking &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) closeDetailModal();
            }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6"
            style={{
              background: "rgba(0, 0, 0, 0.78)",
              backdropFilter: "blur(6px)",
            }}
          >
            <div
              className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)]"
              style={{
                background: "var(--card, var(--bg3))",
                border: "1px solid var(--border)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="p-4 sm:p-5 border-b flex items-start justify-between gap-3 sticky top-0 z-10"
                style={{
                  background: "var(--card, var(--bg3))",
                  borderColor: "var(--border)",
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                      <span>{MATERIAL_ICON[selectedBooking.goodsData?.material] || "📦"}</span>
                      <span>{tr(selectedBooking.goodsData?.material || "Material")}</span>
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        statusConfig[selectedBooking.status] || "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {getStatusLabel(selectedBooking.status, tr)}
                    </span>
                  </div>
                  <h2
                    id="booking-detail-title"
                    className="text-lg sm:text-xl font-extrabold leading-tight mt-1"
                    style={{ color: "var(--text)" }}
                  >
                    {selectedBooking.goodsData?.title || tr("Material Booking")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeDetailModal}
                  aria-label="Close details"
                  className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold transition hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer flex-shrink-0"
                  style={{ color: "var(--text2)", borderColor: "var(--border)" }}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
                {/* Booking ID with Copy */}
                {(() => {
                  const bId =
                    selectedBooking.bookingId ||
                    (selectedBooking.booking && selectedBooking.booking.bookingId) ||
                    "";
                  return (
                    <div
                      className="flex items-center justify-between p-3 rounded-xl border"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-violet-500">
                          {tr("Booking ID")}:
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-extrabold text-violet-600 dark:text-violet-400 truncate">
                          {bId || "—"}
                        </span>
                      </div>
                      {bId && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bId);
                            toast.success(tr("Booking ID copied!"));
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 text-violet-600 dark:text-violet-400 transition hover:bg-violet-500/10 cursor-pointer"
                          style={{ borderColor: "rgba(139, 92, 246, 0.3)" }}
                        >
                          <FiCopy className="text-xs" />
                          <span>{tr("Copy")}</span>
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Timing Row */}
                <div
                  className="flex items-center justify-between p-3 rounded-xl text-xs"
                  style={{ background: "var(--surface)" }}
                >
                  <div className="flex items-center gap-2" style={{ color: "var(--text2)" }}>
                    <FiCalendar className="text-violet-500 flex-shrink-0" />
                    <span>
                      {new Date(selectedBooking.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                  <span className="font-bold text-violet-600 dark:text-violet-400">
                    {getDaysAgo(selectedBooking.createdAt, tr)}
                  </span>
                </div>

                {/* Quantity & Pricing Breakdown */}
                <div
                  className="p-3.5 rounded-xl border space-y-2"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    {tr("Order & Price Summary")}
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm pt-1">
                    <div>
                      <span className="text-xs block" style={{ color: "var(--text3)" }}>
                        {tr("Order Quantity")}
                      </span>
                      <span className="font-extrabold text-base" style={{ color: "var(--text)" }}>
                        {selectedBooking.orderQty}
                      </span>
                    </div>
                    {selectedBooking.goodsData?.unitPrice && (
                      <div>
                        <span className="text-xs block" style={{ color: "var(--text3)" }}>
                          {tr("Unit Price")}
                        </span>
                        <span className="font-bold text-sm" style={{ color: "var(--text)" }}>
                          ₹{selectedBooking.goodsData.unitPrice}
                        </span>
                      </div>
                    )}
                    {selectedBooking.estimatedAmount > 0 && (
                      <div className="col-span-2 pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                        <span className="text-xs block" style={{ color: "var(--text3)" }}>
                          {tr("Total Estimated Amount")}
                        </span>
                        <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">
                          ₹{selectedBooking.estimatedAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Address & Customer Contact */}
                <div
                  className="p-3.5 rounded-xl border space-y-2.5 text-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    {tr("Delivery & Contact")}
                  </p>
                  <div className="flex items-start gap-2.5" style={{ color: "var(--text2)" }}>
                    <FiMapPin className="text-blue-500 text-base mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-xs block font-medium" style={{ color: "var(--text3)" }}>
                        {tr("Delivery Address")}
                      </span>
                      <span className="font-semibold text-sm leading-snug" style={{ color: "var(--text)" }}>
                        {selectedBooking.deliveryAddress}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5" style={{ color: "var(--text2)" }}>
                    <FiPhone className="text-emerald-500 text-base flex-shrink-0" />
                    <div>
                      <span className="text-xs block font-medium" style={{ color: "var(--text3)" }}>
                        {tr("Phone Number")}
                      </span>
                      <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                        {selectedBooking.customerPhone}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Driver (if present) */}
                {(() => {
                  const driver = selectedBooking.driverData || selectedBooking.assignedDriver;
                  if (!driver || !driver.name) return null;
                  return (
                    <div
                      className="p-3.5 rounded-xl border space-y-2"
                      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                        {tr("Assigned Driver")}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
                            <FiTruck />
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                              {driver.name}
                            </p>
                            {driver.vehicle && (
                              <p className="text-xs" style={{ color: "var(--text3)" }}>
                                {driver.vehicle}
                              </p>
                            )}
                          </div>
                        </div>
                        {driver.phone && (
                          <a
                            href={`tel:${driver.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 transition"
                          >
                            <FiPhone className="text-xs" />
                            <span>{tr("Call Driver")}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Status Update Banner */}
                <div
                  className="p-3.5 rounded-xl text-sm leading-relaxed"
                  style={{ background: "var(--surface)", color: "var(--text2)" }}
                >
                  <span className="font-bold" style={{ color: "var(--text)" }}>
                    {tr("Update: ")}
                  </span>
                  {getMessage(selectedBooking, tr)}
                </div>

                {/* Cancellation / Rejection Detailed Notes */}
                {(selectedBooking.status === "CANCELLED_BY_USER" ||
                  selectedBooking.status === "Cancelled by User" ||
                  selectedBooking.status === "CANCELLED_BY_ADMIN" ||
                  selectedBooking.status === "Cancelled by Admin") && (
                  <div className="p-3.5 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs space-y-1">
                    <p className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                      {tr("Cancellation Reason")}
                    </p>
                    <p className="font-medium text-rose-700 dark:text-rose-300">
                      {selectedBooking.cancellationReason || tr("No reason specified")}
                    </p>
                    {selectedBooking.cancelledAt && (
                      <p className="text-[11px] pt-1" style={{ color: "var(--text3)" }}>
                        {tr("Cancelled on:")}{" "}
                        {new Date(selectedBooking.cancelledAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Interactive Cancellation & Feedback Actions */}
                {(() => {
                  const cancelInfo = getCancellationInfo(selectedBooking, now);

                  const isPending =
                    selectedBooking.status === "Pending" || selectedBooking.status === "PENDING";
                  const isConfirmed =
                    selectedBooking.status === "Confirmed" || selectedBooking.status === "CONFIRMED";
                  const isActive = isPending || isConfirmed;

                  // Active booking within 24h of booking: countdown widget + cancel button
                  if (isActive && !cancelInfo.isExpired) {
                    return (
                      <div
                        className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        style={{
                          background: isPending
                            ? "rgba(245, 158, 11, 0.05)"
                            : "rgba(16, 185, 129, 0.05)",
                          borderColor: isPending
                            ? "rgba(245, 158, 11, 0.25)"
                            : "rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        <div className="space-y-1">
                          <div
                            className={`flex items-center gap-2 text-xs font-bold ${
                              isPending
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            <FiClock
                              className={`${
                                isPending ? "text-amber-500" : "text-emerald-500"
                              } text-sm flex-shrink-0`}
                            />
                            <span>
                              {cancelInfo.remainingHoursFormatted}{" "}
                              {tr("remaining to cancel this order")}
                            </span>
                          </div>
                          <p className="text-xs font-medium pl-5" style={{ color: "var(--text3)" }}>
                            {tr("You can cancel this order until")} {cancelInfo.deadlineFormatted}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCancelModalBooking(selectedBooking)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-500/25 transition-all self-start sm:self-auto cursor-pointer"
                        >
                          {tr("Cancel Booking")}
                        </button>
                      </div>
                    );
                  }

                  // Active booking after 24h of booking: expired notice
                  if (isActive && cancelInfo.isExpired) {
                    return (
                      <div
                        className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        style={{
                          background: "rgba(100, 116, 139, 0.06)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            {tr("24-hour cancellation period expired.")}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text3)" }}>
                            {tr("If you need to cancel or modify this order, please contact our owner directly or submit an exceptional request.")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setRequestModalBooking(selectedBooking)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-500/25 transition-all self-start sm:self-auto cursor-pointer"
                          >
                            <span>{tr("Request Cancellation")}</span>
                          </button>
                          <a
                            href="tel:+919787216797"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all self-start sm:self-auto cursor-pointer"
                          >
                            <FiPhone className="text-xs" />
                            <span>{tr("Contact Us")}</span>
                          </a>
                        </div>
                      </div>
                    );
                  }

                  // Delivered: feedback action
                  if (selectedBooking.status === "Delivered") {
                    return (
                      <button
                        type="button"
                        onClick={() => setFeedbackBooking(selectedBooking)}
                        disabled={feedbackIds.includes(selectedBooking._id)}
                        className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50 transition cursor-pointer"
                      >
                        {tr(
                          feedbackIds.includes(selectedBooking._id)
                            ? "Feedback submitted"
                            : "Give feedback"
                        )}
                      </button>
                    );
                  }

                  return null;
                })()}
              </div>

              {/* Sticky Footer */}
              <div
                className="p-4 pb-6 sm:p-5 border-t sticky bottom-0 z-10"
                style={{
                  background: "var(--card, var(--bg3))",
                  borderColor: "var(--border)",
                }}
              >
                <button
                  type="button"
                  onClick={closeDetailModal}
                  className="w-full py-2.5 rounded-xl border text-sm font-semibold transition hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                >
                  {tr("Close")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <CancelBookingModal
          booking={cancelModalBooking}
          onClose={() => setCancelModalBooking(null)}
          onCancelled={handleBookingCancelled}
        />
      )}

      {/* Exceptional Cancellation Request Modal */}
      {requestModalBooking && (
        <RequestCancellationModal
          booking={requestModalBooking}
          onClose={() => setRequestModalBooking(null)}
          onRequestSubmitted={() => {
            API.get("/bookings/my").then((res) => setBookings(res.data));
          }}
        />
      )}

      {/* Feedback Modal */}
      {feedbackBooking && (
        <FeedbackModal
          booking={feedbackBooking}
          user={user}
          onClose={() => setFeedbackBooking(null)}
          onSubmitted={(id) => {
            setFeedbackIds((current) => [...current, id]);
            setFeedbackBooking(null);
          }}
        />
      )}
    </div>
  );
}