// src/pages/admin/Bookings.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import {
  FiCheck,
  FiX,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCopy,
  FiCalendar,
  FiUser,
  FiClock,
  FiArrowLeft,
  FiChevronRight,
  FiTruck,
} from "react-icons/fi";
import { BookingsSkeleton } from "../../components/AdminSkeletons";

const statusConfig = {
  Pending: {
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60",
    dot: "bg-amber-500",
  },
  Confirmed: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60",
    dot: "bg-emerald-500",
  },
  Rejected: {
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
    dot: "bg-rose-500",
  },
  Revoked: {
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800/60",
    dot: "bg-orange-500",
  },
  CANCELLED_BY_USER: {
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
    dot: "bg-rose-500",
    label: "Cancelled by User",
  },
  CANCELLED_BY_ADMIN: {
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60",
    dot: "bg-rose-500",
    label: "Cancelled by Admin",
  },
};

// Unit price display
const getPrice = (b) => {
  if (!Number.isFinite(Number(b.goodsData?.unitPrice))) return "—";
  const unit = b.goodsData?.material === "Bricks" ? "brick" : b.goodsData?.material === "Dry Grass Rolls" ? "roll" : "unit";
  return `₹${b.goodsData.unitPrice}/${unit}`;
};

// Total estimated price calculation
const calculateTotalPrice = (b) => {
  const qty = Number(b.orderQty) || 0;
  const total = qty * (Number(b.goodsData?.unitPrice) || 0);
  if (!total || isNaN(total)) return "—";

  return `₹${total.toLocaleString("en-IN")}`;
};

// Relative days ago helper
const getDaysAgo = (dateStr) => {
  if (!dateStr) return "";
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  if (diffMs < 0) return "Just now";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 0) {
    if (diffHours === 0) {
      if (diffMins <= 1) return "Just now";
      return `${diffMins}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
};

const FILTERS = ["All", "Pending", "Confirmed", "Requests"];
const ACTIVE_STATUSES = [
  "Pending",
  "Confirmed",
  "PENDING",
  "CONFIRMED",
];

export default function Bookings() {
  const { tr } = useTheme();
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [acting, setActing] = useState(null);
  const [reasonDialog, setReasonDialog] = useState(null);
  const [reason, setReason] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const openDetailModal = (b) => {
    setSelectedBooking(b);
    // Push modal state into browser history so mobile hardware/gesture back closes the modal instead of changing page route
    window.history.pushState({ bookingDetailModal: true, id: b._id }, "");
  };

  const closeDetailModal = () => {
    if (window.history.state?.bookingDetailModal) {
      window.history.back(); // Triggers popstate listener which resets selectedBooking
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

  const fetchBookings = () => {
    setLoading(true);
    Promise.all([
      API.get("/bookings"),
      API.get("/bookings/cancellation-requests?status=PENDING").catch(() => ({ data: [] })),
    ])
      .then(([bRes, rRes]) => {
        setBookings(bRes.data || []);
        setCancellationRequests(rRes.data || []);
      })
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirm = async (id) => {
    setActing(id);
    try {
      const { data } = await API.put(`/bookings/${id}/confirm`);
      setBookings((current) => current.map((booking) => (booking._id === id ? data : booking)));
      setSelectedBooking((curr) => (curr && curr._id === id ? data : curr));
      toast.success(tr("Booking confirmed"));
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to confirm"));
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id, rejectionReason) => {
    setActing(id);
    try {
      const { data } = await API.put(`/bookings/${id}/reject`, { reason: rejectionReason });
      setBookings((current) => current.map((booking) => (booking._id === id ? data : booking)));
      if (window.history.state?.bookingDetailModal) {
        window.history.replaceState(null, "");
      }
      setSelectedBooking(null);
      toast.success(tr("Booking rejected"));
      nav("/admin/history");
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to reject"));
    } finally {
      setActing(null);
    }
  };

  const handleRevoke = async (id, revocationReason) => {
    setActing(id);
    try {
      const { data } = await API.put(`/bookings/${id}/revoke`, { reason: revocationReason });
      setBookings((current) => current.map((booking) => (booking._id === id ? data : booking)));
      if (window.history.state?.bookingDetailModal) {
        window.history.replaceState(null, "");
      }
      setSelectedBooking(null);
      toast.success(tr("Booking revoked and availability restored"));
      nav("/admin/history");
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to revoke"));
    } finally {
      setActing(null);
    }
  };

  const handleDeliver = async (id) => {
    setActing(id);
    try {
      await API.put(`/bookings/${id}/deliver`);
      setBookings((current) => current.filter((booking) => booking._id !== id));
      if (window.history.state?.bookingDetailModal) {
        window.history.replaceState(null, "");
      }
      setSelectedBooking(null);
      toast.success(tr("Booking marked as successfully delivered"));
      nav("/admin/history");
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to mark delivered"));
    } finally {
      setActing(null);
    }
  };

  const handleReviewCancellationRequest = async (requestId, action) => {
    setActing(requestId);
    try {
      const res = await API.put(`/bookings/cancellation-requests/${requestId}/review`, {
        action,
      });
      toast.success(
        action === "approve"
          ? tr("Cancellation approved and stock restored")
          : tr("Cancellation request rejected")
      );
      fetchBookings();
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to process request"));
    } finally {
      setActing(null);
    }
  };

  const openReasonDialog = (id, action) => {
    setReason("");
    setReasonDialog({ id, action });
  };

  const submitReason = async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast.error(tr("Please enter a reason"));
      return;
    }
    const { id, action } = reasonDialog;
    setReasonDialog(null);
    if (action === "reject") await handleReject(id, trimmedReason);
    else await handleRevoke(id, trimmedReason);
  };

  const filtered = bookings.filter((b) => {
    let matchFilter = false;
    if (filter === "All") {
      matchFilter = ACTIVE_STATUSES.includes(b.status);
    } else if (filter === "Pending") {
      matchFilter = b.status === "Pending" || b.status === "PENDING";
    } else if (filter === "Confirmed") {
      matchFilter = b.status === "Confirmed" || b.status === "CONFIRMED";
    } else if (filter === "Requests") {
      return false; // Handled in dedicated Requests view
    }

    const query = search.trim().toLowerCase();
    if (!query) return matchFilter;

    const bookingId = (b.bookingId || "").toLowerCase();
    const customerName = (b.customerName || `${b.user?.firstName || ""} ${b.user?.lastName || ""}`).toLowerCase();
    const customerPhone = (b.customerPhone || "").toLowerCase();
    const customerEmail = (b.customerEmail || "").toLowerCase();
    const material = (b.goodsData?.material || "").toLowerCase();
    const title = (b.goodsData?.title || "").toLowerCase();
    const address = (b.deliveryAddress || "").toLowerCase();

    const matchSearch =
      bookingId.includes(query) ||
      customerName.includes(query) ||
      customerPhone.includes(query) ||
      customerEmail.includes(query) ||
      material.includes(query) ||
      title.includes(query) ||
      address.includes(query);

    return matchFilter && matchSearch;
  });

  const counts = { All: 0, Pending: 0, Confirmed: 0, Requests: cancellationRequests.length };
  bookings.forEach((b) => {
    if (b.status === "Pending" || b.status === "PENDING") counts.Pending++;
    else if (b.status === "Confirmed" || b.status === "CONFIRMED") counts.Confirmed++;
  });
  counts.All = counts.Pending + counts.Confirmed;

  return (
    <div className="w-full max-w-[1550px] mx-auto space-y-8 px-4 sm:px-6 py-8 pb-16">
      {/* Header & Metric Summary Cards */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            {tr("Bookings Dashboard")}
          </h1>
          <p className="text-base mt-1" style={{ color: "var(--text3)" }}>
            {tr("Manage, inspect, and approve orders in real-time")}
          </p>
        </div>

      </div>

      {loading ? (
        <BookingsSkeleton />
      ) : (
        <>
          {/* Control Bar: Filters & Search */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border shadow-sm"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                    filter === f
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  style={{ color: filter === f ? "#ffffff" : "var(--text2)" }}
                >
                  {tr(f)}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${filter === f ? "bg-white/25" : "bg-black/10 dark:bg-white/10"}`}>
                    {counts[f]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative sm:w-80">
              <input
                type="text"
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
                style={{
                  background: "var(--input-bg)",
                  border: "1px solid var(--input-border)",
                  color: "var(--input-text)",
                }}
                placeholder={tr("Search customer, item, title...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-3.5 top-3 text-sm opacity-50 select-none">🔍</span>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-3 text-sm opacity-50 hover:opacity-100"
                  style={{ color: "var(--text)" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Bookings Table / Container */}
          <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {filter === "Requests" ? (
          /* Exceptional Cancellation Requests View */
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                  {tr("Exceptional Cancellation Requests")}
                </h2>
                <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text3)" }}>
                  {tr("Requests submitted by customers after the 24-hour standard cancellation window expired.")}
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {cancellationRequests.length} {tr("pending")}
              </span>
            </div>

            {cancellationRequests.length === 0 ? (
              <div className="py-20 text-center text-sm" style={{ color: "var(--text3)" }}>
                {tr("No pending cancellation requests at this time.")}
              </div>
            ) : (
              <div className="grid gap-4">
                {cancellationRequests.map((req) => (
                  <div
                    key={req._id}
                    className="p-4 sm:p-5 rounded-2xl border space-y-3.5 transition"
                    style={{ background: "var(--bg)", borderColor: "var(--border)" }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          {req.bookingId || req.booking?.bookingId || "—"}
                        </span>
                        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                          {req.customerName || `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() || "Customer"}
                        </span>
                        {req.customerPhone && (
                          <a
                            href={`tel:${req.customerPhone}`}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            📞 {req.customerPhone}
                          </a>
                        )}
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--text3)" }}>
                        {new Date(req.requestedAt || req.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border text-xs" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                      <p className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px] mb-1">
                        {tr("Customer's Reason for Cancellation")}
                      </p>
                      <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text)" }}>
                        {req.reason}
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleReviewCancellationRequest(req._id, "approve")}
                        disabled={acting === req._id}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
                      >
                        {acting === req._id ? "..." : tr("Approve Cancellation")}
                      </button>
                      <button
                        onClick={() => handleReviewCancellationRequest(req._id, "reject")}
                        disabled={acting === req._id}
                        className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition disabled:opacity-50 cursor-pointer"
                      >
                        {tr("Reject Request")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b text-xs font-bold uppercase tracking-wider" style={{ borderColor: "var(--border)", color: "var(--text3)" }}>
                    <th className="py-4 px-5">Booking ID</th>
                    <th className="py-4 px-5">Contact Details</th>
                    <th className="py-4 px-5">Material</th>
                    <th className="py-4 px-5 min-w-[220px]">Delivery Address</th>
                    <th className="py-4 px-5">Order Qty</th>
                    <th className="py-4 px-5">Unit Price</th>
                    <th className="py-4 px-5 text-emerald-600 dark:text-emerald-400">Total Est. Price</th>
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm" style={{ borderColor: "var(--border)" }}>
                  {filtered.map((b) => {
                    const statusMeta = statusConfig[b.status] || { badge: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
                    const estimatedTotal = calculateTotalPrice(b);

                    return (
                      <tr key={b._id} className="hover:bg-violet-500/[0.02] transition-colors">
                        {/* Booking ID */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                              {b.bookingId || "—"}
                            </span>
                            {b.bookingId && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(b.bookingId);
                                  toast.success("Booking ID copied!");
                                }}
                                title="Copy Booking ID"
                                className="p-1 rounded text-xs text-gray-400 hover:text-violet-600 transition"
                              >
                                <FiCopy />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Contact Details */}
                        <td className="py-4 px-5">
                          <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{b.customerName || "—"}</p>
                          <p className="text-xs font-medium opacity-85" style={{ color: "var(--text2)" }}>{b.customerPhone}</p>
                          <p className="text-xs opacity-65 truncate max-w-[150px]" style={{ color: "var(--text3)" }}>{b.customerEmail}</p>
                        </td>

                        {/* Material Info */}
                        <td className="py-4 px-5">
                          <p className="font-bold text-sm" style={{ color: "var(--text)" }}>{b.goodsData?.title || "Untitled goods"}</p>
                          <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>{b.goodsData?.material || "Material"}</p>
                        </td>

                        {/* Delivery Address */}
                        <td className="py-4 px-5 min-w-[220px] max-w-[280px]">
                          <p className="rounded-xl px-3 py-2 text-sm font-semibold leading-snug" title={b.deliveryAddress} style={{ background: "rgba(59, 130, 246, 0.10)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "var(--text)" }}>
                            {b.deliveryAddress || "—"}
                          </p>
                        </td>

                        {/* Order Quantity */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="font-bold text-sm inline-block" style={{ color: "var(--text)" }}>
                            {b.orderQty} {b.goodsData?.material === "Bricks" ? "bricks" : b.goodsData?.material === "Dry Grass Rolls" ? "rolls" : "units"}
                          </span>
                        </td>

                        {/* Unit Price */}
                        <td className="py-4 px-5 font-semibold text-violet-600 dark:text-violet-400 whitespace-nowrap">
                          {getPrice(b)}
                        </td>

                        {/* Total Estimated Price in Green */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                            {estimatedTotal}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-5 whitespace-nowrap text-xs font-medium" style={{ color: "var(--text3)" }}>
                          {new Date(b.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusMeta.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                            {tr(b.status)}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {b.status === "Pending" || b.status === "PENDING" ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleConfirm(b._id)}
                                disabled={acting === b._id}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/30 transition disabled:opacity-50 cursor-pointer"
                              >
                                {acting === b._id ? "..." : tr("Approve")}
                              </button>
                              <button
                                onClick={() => openReasonDialog(b._id, "reject")}
                                disabled={acting === b._id}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border border-rose-500/30 transition disabled:opacity-50 cursor-pointer"
                              >
                                {acting === b._id ? "..." : tr("Reject")}
                              </button>
                            </div>
                          ) : b.status === "Confirmed" || b.status === "CONFIRMED" ? (
                            <div className="inline-flex items-center justify-end gap-2">
                              <button onClick={() => handleDeliver(b._id)} disabled={acting === b._id} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border border-blue-500/30 transition disabled:opacity-50 cursor-pointer">
                                {acting === b._id ? "..." : tr("Delivered")}
                              </button>
                              <button onClick={() => openReasonDialog(b._id, "revoke")} disabled={acting === b._id} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-500/15 text-orange-600 hover:bg-orange-500/25 border border-orange-500/30 transition disabled:opacity-50 cursor-pointer">
                                {tr("Revoke")}
                              </button>
                            </div>
                          ) : ["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(b.status) ? (
                            <div className="text-right space-y-0.5">
                              <span className="inline-block text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                                🚫 {b.status === "CANCELLED_BY_USER" || b.status === "Cancelled by User" ? tr("Cancelled by User") : tr("Cancelled by Admin")}
                              </span>
                              {b.cancelledAt && (
                                <p className="text-[10px]" style={{ color: "var(--text3)" }}>
                                  {new Date(b.cancelledAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              )}
                              {b.cancellationReason && (
                                <p className="text-[11px] font-medium text-rose-500/90 max-w-[190px] truncate" title={b.cancellationReason}>
                                  {b.cancellationReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm opacity-40 select-none" style={{ color: "var(--text3)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-20 text-center text-sm" style={{ color: "var(--text3)" }}>
                        No bookings match the selected criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List - Simple & Organized Card Style */}
            <div className="md:hidden p-3 sm:p-4 space-y-3.5">
              {filtered.map((b) => {
                const statusMeta = statusConfig[b.status] || { badge: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
                const estimatedTotal = calculateTotalPrice(b);
                const quantityLabel = b.goodsData?.material === "Bricks" ? "bricks" : b.goodsData?.material === "Dry Grass Rolls" ? "rolls" : "units";
                const materialIcon = b.goodsData?.material === "Bricks" ? "🧱" : b.goodsData?.material === "Dry Grass Rolls" ? "🌾" : b.goodsData?.material === "River Sand" ? "🏖️" : "⛏️";

                return (
                  <div
                    key={b._id}
                    onClick={() => openDetailModal(b)}
                    className="rounded-2xl border p-4 space-y-3 transition shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer group"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                    }}
                  >
                    {/* Top Row: Which Material (Top-Left) & Status (Top-Right) */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20">
                        <span>{materialIcon}</span>
                        <span>{b.goodsData?.material || "Material"}</span>
                      </span>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border flex-shrink-0 ${statusMeta.badge}`}>
                        <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                        {tr(b.status)}
                      </span>
                    </div>

                    {/* Below Material: Full Title of Good */}
                    <div>
                      <h3 className="text-base font-extrabold leading-snug break-words" style={{ color: "var(--text)" }}>
                        {b.goodsData?.title || "Untitled goods"}
                      </h3>
                    </div>

                    {/* Quantity & Total Amount */}
                    <div
                      className="grid grid-cols-2 gap-3 rounded-xl p-2.5 border"
                      style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
                    >
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text3)" }}>Quantity</p>
                        <p className="mt-0.5 text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {b.orderQty} <span className="text-xs font-normal">{quantityLabel}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text3)" }}>Total Amount</p>
                        <p className="mt-0.5 text-base font-black text-emerald-600 dark:text-emerald-400">
                          {estimatedTotal}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                      {(b.status === "Pending" || b.status === "PENDING") && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleConfirm(b._id)}
                            disabled={acting === b._id}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <FiCheck className="text-sm" />
                            {acting === b._id ? "..." : tr("Approve")}
                          </button>
                          <button
                            onClick={() => openReasonDialog(b._id, "reject")}
                            disabled={acting === b._id}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <FiX className="text-sm" />
                            {acting === b._id ? "..." : tr("Reject")}
                          </button>
                        </div>
                      )}

                      {(b.status === "Confirmed" || b.status === "CONFIRMED") && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeliver(b._id)}
                            disabled={acting === b._id}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <FiCheck className="text-sm" />
                            {acting === b._id ? "..." : tr("Delivered")}
                          </button>
                          <button
                            onClick={() => openReasonDialog(b._id, "revoke")}
                            disabled={acting === b._id}
                            className="flex-1 py-2 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border border-orange-500/30 transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <FiX className="text-sm" />
                            {tr("Revoke")}
                          </button>
                        </div>
                      )}

                      {["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(b.status) && (
                        <div className="w-full text-center py-1.5 rounded-xl border bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs">
                          🚫 {b.status === "CANCELLED_BY_USER" || b.status === "Cancelled by User" ? tr("Cancelled by Customer") : tr("Cancelled by Admin")}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Timing (How many days ago) + View Details cue */}
                    <div className="flex items-center justify-between text-xs pt-2.5 border-t" style={{ borderColor: "var(--border)", color: "var(--text3)" }}>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <FiClock className="text-xs text-violet-500 flex-shrink-0" />
                        <span>{getDaysAgo(b.createdAt)}</span>
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-violet-600 dark:text-violet-400 font-semibold group-hover:underline">
                        {tr("View Details")} <FiChevronRight />
                      </span>
                    </div>
                  </div>
                );
              })}

              {filtered.length === 0 && (
                <div className="py-14 text-center text-sm" style={{ color: "var(--text3)" }}>
                  {tr("No bookings match the current filter.")}
                </div>
              )}
            </div>
          </>
        )}
      </div>
        </>
      )}

      {/* Booking Full Details Modal - Full screen portal with back navigation safety */}
      {selectedBooking && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[9999] flex items-center justify-center p-3.5 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={closeDetailModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[85vh] sm:max-h-[88vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden my-auto"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Modal Header with Back / Close Button */}
            <div
              className="flex items-center justify-between p-4 sm:p-5 border-b sticky top-0 z-10"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={closeDetailModal}
                  className="p-2 -ml-1 rounded-xl text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  title="Back"
                >
                  <FiArrowLeft className="text-base" />
                  <span>{tr("Back")}</span>
                </button>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold leading-tight" style={{ color: "var(--text)" }}>
                    {tr("Booking Details")}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-600 dark:text-violet-400">
                      {selectedBooking.bookingId || "—"}
                    </span>
                    {selectedBooking.bookingId && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedBooking.bookingId);
                          toast.success("Booking ID copied!");
                        }}
                        className="p-1 rounded text-xs text-gray-400 hover:text-violet-500 transition cursor-pointer"
                        title="Copy ID"
                      >
                        <FiCopy className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={closeDetailModal}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Status & Timing Banner */}
              <div
                className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
              >
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig[selectedBooking.status]?.badge || "bg-gray-100 text-gray-700"}`}>
                    <span className={`w-2 h-2 rounded-full ${statusConfig[selectedBooking.status]?.dot || "bg-gray-400"}`} />
                    {tr(selectedBooking.status)}
                  </span>
                </div>
                <div className="text-right text-xs" style={{ color: "var(--text3)" }}>
                  <span className="font-semibold block">{getDaysAgo(selectedBooking.createdAt)}</span>
                  <span className="text-[11px] opacity-75">
                    {new Date(selectedBooking.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Material & Order Info */}
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Material Information</span>
                  <h4 className="text-base font-extrabold mt-0.5" style={{ color: "var(--text)" }}>
                    {selectedBooking.goodsData?.title || "Untitled goods"}
                  </h4>
                  <p className="text-xs font-medium" style={{ color: "var(--text3)" }}>
                    Category: {selectedBooking.goodsData?.material || "—"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t text-center" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text3)" }}>Unit Price</p>
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mt-0.5">{getPrice(selectedBooking)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text3)" }}>Order Qty</p>
                    <p className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5">
                      {selectedBooking.orderQty} {selectedBooking.goodsData?.material === "Bricks" ? "bricks" : selectedBooking.goodsData?.material === "Dry Grass Rolls" ? "rolls" : "units"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold" style={{ color: "var(--text3)" }}>Total Est.</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{calculateTotalPrice(selectedBooking)}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div
                className="p-4 rounded-2xl border space-y-1.5"
                style={{ background: "rgba(59, 130, 246, 0.08)", borderColor: "rgba(59, 130, 246, 0.22)" }}
              >
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
                  <FiMapPin className="text-sm" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-sm font-semibold leading-relaxed break-words" style={{ color: "var(--text)" }}>
                  {selectedBooking.deliveryAddress || "—"}
                </p>
              </div>

              {/* Customer Information */}
              <div
                className="p-4 rounded-2xl border space-y-3"
                style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--text3)" }}>
                    <FiUser className="text-xs" /> Customer Details
                  </span>
                  {selectedBooking.customerPhone && (
                    <a
                      href={`tel:${selectedBooking.customerPhone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <FiPhone className="text-xs" /> Call Customer
                    </a>
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="font-extrabold text-sm" style={{ color: "var(--text)" }}>
                    {selectedBooking.customerName || "—"}
                  </p>
                  {selectedBooking.customerPhone && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <FiPhone className="text-xs opacity-75" />
                      <span>{selectedBooking.customerPhone}</span>
                    </div>
                  )}
                  {selectedBooking.customerEmail && (
                    <div className="flex items-center gap-2 text-xs opacity-80" style={{ color: "var(--text2)" }}>
                      <FiMail className="text-xs opacity-75" />
                      <span className="break-all">{selectedBooking.customerEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Details (if assigned) */}
              {selectedBooking.driverData && (
                <div
                  className="p-4 rounded-2xl border space-y-2"
                  style={{ background: "var(--bg2)", borderColor: "var(--border)" }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-violet-500">
                    <FiTruck className="text-xs" /> Assigned Driver
                  </span>
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                    {selectedBooking.driverData.name || "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text2)" }}>
                    {selectedBooking.driverData.phone && (
                      <a href={`tel:${selectedBooking.driverData.phone}`} className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <FiPhone className="text-xs" /> {selectedBooking.driverData.phone}
                      </a>
                    )}
                    {selectedBooking.driverData.vehicle && (
                      <span className="opacity-80">Vehicle: {selectedBooking.driverData.vehicle}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Cancelled / Revocation / Rejection Info */}
              {selectedBooking.cancellationReason && (
                <div className="p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/20 text-xs space-y-1">
                  <p className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                    Cancellation Reason
                  </p>
                  <p className="font-medium text-rose-600 dark:text-rose-300">
                    {selectedBooking.cancellationReason}
                  </p>
                </div>
              )}
              {selectedBooking.rejectionReason && (
                <div className="p-3.5 rounded-2xl border bg-rose-500/10 border-rose-500/20 text-xs space-y-1">
                  <p className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                    Rejection Reason
                  </p>
                  <p className="font-medium text-rose-600 dark:text-rose-300">
                    {selectedBooking.rejectionReason}
                  </p>
                </div>
              )}
              {selectedBooking.revokedReason && (
                <div className="p-3.5 rounded-2xl border bg-orange-500/10 border-orange-500/20 text-xs space-y-1">
                  <p className="font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider text-[10px]">
                    Revocation Reason
                  </p>
                  <p className="font-medium text-orange-600 dark:text-orange-300">
                    {selectedBooking.revokedReason}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions Footer - lifted slightly above bottom edge */}
            <div
              className="p-4 pt-3 pb-6 sm:p-5 border-t sticky bottom-0 z-10"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
              }}
            >
              {(selectedBooking.status === "Pending" || selectedBooking.status === "PENDING") && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleConfirm(selectedBooking._id)}
                    disabled={acting === selectedBooking._id}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <FiCheck className="text-base" />
                    {acting === selectedBooking._id ? "Processing..." : tr("Approve Booking")}
                  </button>
                  <button
                    onClick={() => openReasonDialog(selectedBooking._id, "reject")}
                    disabled={acting === selectedBooking._id}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <FiX className="text-base" />
                    {acting === selectedBooking._id ? "Processing..." : tr("Reject")}
                  </button>
                </div>
              )}

              {(selectedBooking.status === "Confirmed" || selectedBooking.status === "CONFIRMED") && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDeliver(selectedBooking._id)}
                    disabled={acting === selectedBooking._id}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <FiCheck className="text-base" />
                    {acting === selectedBooking._id ? "Processing..." : tr("Delivered")}
                  </button>
                  <button
                    onClick={() => openReasonDialog(selectedBooking._id, "revoke")}
                    disabled={acting === selectedBooking._id}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border border-orange-500/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <FiX className="text-base" />
                    {tr("Revoke")}
                  </button>
                </div>
              )}

              {["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin"].includes(selectedBooking.status) && (
                <button
                  onClick={closeDetailModal}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 transition cursor-pointer"
                >
                  {tr("Close Details")}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {reasonDialog && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 w-screen h-screen min-h-[100dvh] z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl my-auto" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
                  {reasonDialog.action === "revoke" ? "Revoke booking" : "Reject booking"}
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>
                  Enter the reason. It will be saved with this booking.
                </p>
              </div>
              <button onClick={() => setReasonDialog(null)} style={{ color: "var(--text3)" }}>✕</button>
            </div>
            <textarea
              autoFocus
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonDialog.action === "revoke" ? "Why is this approved booking being revoked?" : "Why is this booking being rejected?"}
              className="w-full rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setReasonDialog(null)} className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ color: "var(--text2)", border: "1px solid var(--border)" }}>Cancel</button>
              <button onClick={submitReason} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition">Save reason</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}