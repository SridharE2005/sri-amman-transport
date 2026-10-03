// src/pages/admin/Messages.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import { MessagesSkeleton } from "../../components/AdminSkeletons";
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiCopy,
  FiExternalLink,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPhoneCall,
  FiSend,
  FiTrash2,
  FiTruck,
  FiX,
  FiXCircle,
} from "react-icons/fi";

const REJECT_PRESETS = [
  "Sorry, your order was already on the way and cannot be cancelled at this stage.",
  "Vehicle has already been dispatched from Salem yard with your materials. Delivery is in progress.",
  "Lorry has already loaded your goods and is en route to your delivery location.",
  "Driver is currently en route. Order cannot be cancelled at this stage.",
];

export default function Messages() {
  const { tr } = useTheme();
  const nav = useNavigate();

  // Active top-level tab: 'cancellations' | 'enquiries'
  const [activeTab, setActiveTab] = useState("cancellations");

  // Data state
  const [messages, setMessages] = useState([]);
  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  // Popups state with browser back navigation
  const [activeCancellationModal, setActiveCancellationModal] = useState(null);
  const [activeMessageModal, setActiveMessageModal] = useState(null);

  // Cancellation action states inside popup
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelAdminNote, setCancelAdminNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectMessage, setRejectMessage] = useState(REJECT_PRESETS[0]);

  // Message reply state inside popup
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Fetch only active pending cancellation requests (approved/cancelled ones move to Admin History)
  const fetchData = async () => {
    setLoading(true);
    try {
      const [msgRes, cancelRes] = await Promise.all([
        API.get("/messages").catch(() => ({ data: [] })),
        API.get("/bookings/cancellation-requests?status=PENDING").catch(() => ({ data: [] })),
      ]);
      setMessages(msgRes.data || []);
      setCancellationRequests(cancelRes.data || []);

      // Admin has visited this page -> mark messages as viewed/read and clear count badge
      try {
        localStorage.setItem("admin_last_viewed_messages", Date.now().toString());
        localStorage.setItem("admin_last_viewed_cancellations", Date.now().toString());
        window.dispatchEvent(new Event("admin_badges_updated"));
        API.put("/messages/mark-all-read", {}, { skipLoading: true, silent: true }).catch(() => {});
      } catch {}
    } catch {
      toast.error(tr("Failed to load data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ── Manage Browser Back Navigation for Popups ── */
  useEffect(() => {
    const handlePopState = (e) => {
      // If user hit the back button, close open modals smoothly
      setActiveCancellationModal(null);
      setActiveMessageModal(null);
      setShowCancelConfirm(false);
      setShowRejectForm(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openCancellationPopup = (req) => {
    setActiveCancellationModal(req);
    setShowCancelConfirm(false);
    setShowRejectForm(false);
    setCancelAdminNote("");
    setRejectMessage(REJECT_PRESETS[0]);
    window.history.pushState({ popup: "cancellation", id: req._id }, "");
  };

  const closeCancellationPopup = () => {
    if (window.history.state?.popup === "cancellation") {
      window.history.back();
    } else {
      setActiveCancellationModal(null);
      setShowCancelConfirm(false);
      setShowRejectForm(false);
    }
  };

  const openMessagePopup = (msg) => {
    setActiveMessageModal(msg);
    setReplyText(msg.reply || "");
    if (!msg.read) {
      API.put(`/messages/${msg._id}`, { reply: msg.reply || "" }, { skipLoading: true, silent: true })
        .then(() => {
          setMessages((prev) => prev.map((x) => (x._id === msg._id ? { ...x, read: true } : x)));
        })
        .catch(() => {});
    }
    window.history.pushState({ popup: "message", id: msg._id }, "");
  };

  const closeMessagePopup = () => {
    if (window.history.state?.popup === "message") {
      window.history.back();
    } else {
      setActiveMessageModal(null);
    }
  };

  /* ── Cancellation Actions ── */
  const handleApproveCancelOrder = async () => {
    if (!activeCancellationModal) return;
    const reqId = activeCancellationModal._id;
    setActing(reqId);
    try {
      await API.put(`/bookings/cancellation-requests/${reqId}/review`, {
        action: "approve",
        adminNotes: cancelAdminNote.trim(),
      });
      toast.success(tr("Order cancelled successfully and moved to Admin History"));
      closeCancellationPopup();
      await fetchData();
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to cancel order"));
    } finally {
      setActing(null);
    }
  };

  const handleRejectWithNotification = async () => {
    if (!activeCancellationModal) return;
    if (!rejectMessage.trim()) {
      toast.error(tr("Please provide a message for the customer"));
      return;
    }
    const reqId = activeCancellationModal._id;
    setActing(reqId);
    try {
      await API.put(`/bookings/cancellation-requests/${reqId}/review`, {
        action: "reject",
        adminNotes: rejectMessage.trim(),
      });
      toast.success(tr("Notification sent to customer: Cancellation rejected"));
      closeCancellationPopup();
      await fetchData();
    } catch (err) {
      toast.error(tr(err.response?.data?.message || "Failed to reject cancellation"));
    } finally {
      setActing(null);
    }
  };

  const handleDeleteCancellation = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm(tr("Are you sure you want to remove this cancellation record?"))) return;
    try {
      await API.delete(`/bookings/cancellation-requests/${id}`);
      setCancellationRequests((prev) => prev.filter((x) => x._id !== id));
      if (activeCancellationModal?._id === id) closeCancellationPopup();
      toast.success(tr("Cancellation request removed"));
    } catch {
      toast.error(tr("Failed to delete request"));
    }
  };

  /* ── Message Actions ── */
  const handleSendReply = async () => {
    if (!replyText.trim()) {
      toast.error(tr("Please type a reply"));
      return;
    }
    setSendingReply(true);
    try {
      const { data } = await API.put(`/messages/${activeMessageModal._id}`, { reply: replyText });
      setMessages((prev) => prev.map((x) => (x._id === activeMessageModal._id ? data : x)));
      setActiveMessageModal(data);
      toast.success(`${tr("Reply saved for")} ${data.name}`);
    } catch {
      toast.error(tr("Failed to send reply"));
    } finally {
      setSendingReply(false);
    }
  };

  const handleDeleteMessage = async (e, id) => {
    if (e) e.stopPropagation();
    try {
      await API.delete(`/messages/${id}`);
      setMessages((prev) => prev.filter((x) => x._id !== id));
      if (activeMessageModal?._id === id) closeMessagePopup();
      toast.success(tr("Message deleted"));
    } catch {
      toast.error(tr("Failed to delete"));
    }
  };

  const copyToClipboard = (e, text, label = "Phone number") => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(text);
    toast.info(`${label} copied: ${text}`);
  };

  // Badge counters
  const unreadMessagesCount = messages.filter((m) => !m.read).length;
  const pendingCancellationsCount = cancellationRequests.length;

  return (
    <div className="space-y-6">
      {/* Top Header & The ONLY 2 Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>
            {tr("Messages & Requests")}
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>
            {tr("Customer enquiries and booking cancellation requests")}
          </p>
        </div>

        {/* 2 Main Tabs with Live Badges */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl glass border w-full sm:w-auto" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => setActiveTab("cancellations")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "cancellations"
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-[var(--text2)] hover:bg-white/5"
            }`}
          >
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{tr("Cancellation Requests")}</span>
            {pendingCancellationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black animate-pulse">
                {pendingCancellationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("enquiries")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "enquiries"
                ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-500/20"
                : "text-[var(--text2)] hover:bg-white/5"
            }`}
          >
            <FiMessageSquare className="w-4 h-4 flex-shrink-0" />
            <span>{tr("Contact Messages")}</span>
            {unreadMessagesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[11px] font-black">
                {unreadMessagesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: CANCELLATION REQUESTS (COMPACT CARDS GRID) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "cancellations" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: "var(--text3)" }}>
                {cancellationRequests.length} {tr("pending cancellation request(s)")}
              </span>
              <button
                onClick={() => nav("/admin/history")}
                className="text-xs font-bold text-violet-500 hover:text-violet-400 flex items-center gap-1 hover:underline cursor-pointer ml-2"
              >
                <span>{tr("View Cancelled in Admin History")}</span>
                <FiArrowRight className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={fetchData}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border hover:bg-white/5 transition cursor-pointer self-start sm:self-auto"
              style={{ borderColor: "var(--border)", color: "var(--text2)" }}
            >
              🔄 {tr("Refresh")}
            </button>
          </div>

          {loading ? (
            <MessagesSkeleton />
          ) : cancellationRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3 glass rounded-2xl border" style={{ borderColor: "var(--border)" }}>
              <span className="text-5xl block mb-2">🎉</span>
              <p className="font-bold text-base" style={{ color: "var(--text)" }}>
                {tr("No pending cancellation requests")}
              </p>
              <p className="text-xs max-w-md mx-auto" style={{ color: "var(--text3)" }}>
                {tr("All requests have been handled. Once you cancel an order, it automatically moves to Admin History.")}
              </p>
              <button
                onClick={() => nav("/admin/history")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border hover:bg-white/5 transition"
                style={{ borderColor: "var(--border)", color: "var(--text2)" }}
              >
                <FiExternalLink className="w-3.5 h-3.5" />
                <span>{tr("Go to Admin History")}</span>
              </button>
            </div>
          ) : (
            /* Responsive Grid of Small Cards */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cancellationRequests.map((req) => {
                const bookingId = req.bookingId || req.booking?.bookingId || "—";
                const customerName =
                  req.customerName ||
                  `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim() ||
                  "Customer";

                return (
                  <div
                    key={req._id}
                    onClick={() => openCancellationPopup(req)}
                    className="p-4 rounded-2xl border glass flex flex-col justify-between space-y-3 hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer group relative"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {/* Card Header */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            {bookingId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyToClipboard(e, bookingId, "Booking ID")}
                            className="p-1 rounded text-[var(--text3)] hover:text-[var(--text)] transition cursor-pointer"
                            title="Copy ID"
                          >
                            <FiCopy className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse flex-shrink-0">
                          {tr("Pending Review")}
                        </span>
                      </div>

                      {/* Customer & Timestamp */}
                      <div>
                        <h3 className="font-bold text-sm group-hover:text-amber-500 transition-colors" style={{ color: "var(--text)" }}>
                          {customerName}
                        </h3>
                        <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "var(--text3)" }}>
                          <FiClock className="w-3 h-3" />
                          {new Date(req.requestedAt || req.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Calling Details */}
                      {req.customerPhone && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <a
                            href={`tel:${req.customerPhone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition"
                          >
                            <FiPhoneCall className="w-3 h-3" />
                            <span>{req.customerPhone}</span>
                          </a>
                        </div>
                      )}

                      {/* Customer Reason Box */}
                      <div
                        className="p-2.5 rounded-xl border text-xs bg-amber-500/5 space-y-0.5"
                        style={{ borderColor: "rgba(245, 158, 11, 0.25)" }}
                      >
                        <p className="font-bold text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {tr("Cancellation Reason")}:
                        </p>
                        <p className="text-xs font-semibold leading-relaxed line-clamp-2" style={{ color: "var(--text)" }}>
                          "{req.reason}"
                        </p>
                      </div>
                    </div>

                    {/* Card Footer: Quick Action Trigger */}
                    <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                      <span className="text-[11px] font-bold text-amber-500 group-hover:underline flex items-center gap-1">
                        <span>{tr("Review & Take Action")}</span>
                        <FiArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>

                      <button
                        onClick={(e) => handleDeleteCancellation(e, req._id)}
                        className="p-1 text-[var(--text3)] hover:text-rose-500 transition cursor-pointer"
                        title={tr("Delete")}
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: CONTACT MESSAGES (COMPACT CARDS GRID) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "enquiries" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold" style={{ color: "var(--text3)" }}>
              {messages.length} {tr("contact messages total")}
              {unreadMessagesCount > 0 && (
                <span className="ml-2 text-violet-500 font-bold">
                  ({unreadMessagesCount} {tr("unread")})
                </span>
              )}
            </p>

            <button
              onClick={fetchData}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border hover:bg-white/5 transition cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--text2)" }}
            >
              🔄 {tr("Refresh")}
            </button>
          </div>

          {loading ? (
            <MessagesSkeleton />
          ) : messages.length === 0 ? (
            <div className="p-12 text-center space-y-2 glass rounded-2xl border" style={{ borderColor: "var(--border)" }}>
              <span className="text-5xl block mb-2">💬</span>
              <p className="font-bold text-base" style={{ color: "var(--text)" }}>
                {tr("No messages")}
              </p>
              <p className="text-xs" style={{ color: "var(--text3)" }}>
                {tr("Customer contact inquiries will appear here.")}
              </p>
            </div>
          ) : (
            /* Responsive Grid of Message Cards */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => openMessagePopup(msg)}
                  className={`p-4 rounded-2xl border glass flex flex-col justify-between space-y-3 transition-all shadow-sm hover:shadow-md cursor-pointer group relative ${
                    !msg.read ? "border-violet-500/50 bg-violet-500/5" : "hover:border-violet-500/30"
                  }`}
                  style={{ borderColor: !msg.read ? undefined : "var(--border)" }}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {!msg.read && (
                          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 flex-shrink-0 animate-pulse" />
                        )}
                        <h3 className={`text-sm truncate ${!msg.read ? "font-extrabold" : "font-semibold"}`} style={{ color: "var(--text)" }}>
                          {msg.name}
                        </h3>
                      </div>

                      <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text3)" }}>
                        {new Date(msg.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                      </span>
                    </div>

                    <p className="text-xs font-bold truncate text-violet-600 dark:text-violet-400">
                      {msg.subject}
                    </p>

                    <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--text2)" }}>
                      {msg.message}
                    </p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                    <span className="text-[11px] font-semibold flex items-center gap-1 text-[var(--text3)] group-hover:text-[var(--text2)]">
                      <span>{msg.reply ? "✓ Replied" : "Reply →"}</span>
                    </span>

                    <button
                      onClick={(e) => handleDeleteMessage(e, msg._id)}
                      className="p-1 text-[var(--text3)] hover:text-rose-500 transition cursor-pointer"
                      title={tr("Delete")}
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* POPUP 1: CANCELLATION REQUEST DETAILS & ACTION MODAL */}
      {/* (WITH FULL BACK NAVIGATION SUPPORT) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeCancellationModal && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCancellationPopup();
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5 sm:p-6 border glass space-y-4 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto"
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-black px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {activeCancellationModal.bookingId || activeCancellationModal.booking?.bookingId || "—"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse">
                    {tr("Pending Review")}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text3)" }}>
                  {tr("Requested on")}:{" "}
                  {new Date(activeCancellationModal.requestedAt || activeCancellationModal.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCancellationPopup}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold hover:bg-white/10 transition cursor-pointer flex-shrink-0"
                style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Customer & Direct Calling Section */}
            <div
              className="p-3.5 rounded-xl border space-y-2.5"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {tr("Customer Contact & Calling Details")}
                </span>
                <span className="font-bold text-xs" style={{ color: "var(--text)" }}>
                  {activeCancellationModal.customerName ||
                    `${activeCancellationModal.user?.firstName || ""} ${activeCancellationModal.user?.lastName || ""}`.trim() ||
                    "Customer"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeCancellationModal.customerPhone ? (
                  <>
                    <a
                      href={`tel:${activeCancellationModal.customerPhone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <FiPhoneCall className="w-3.5 h-3.5" />
                      <span>{tr("Call")}: {activeCancellationModal.customerPhone}</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => copyToClipboard(e, activeCancellationModal.customerPhone, "Phone")}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border hover:bg-white/5 text-xs font-semibold transition cursor-pointer"
                      style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                    >
                      <FiCopy className="w-3 h-3" />
                      <span>{tr("Copy")}</span>
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-rose-400">{tr("No phone provided")}</p>
                )}

                {activeCancellationModal.customerEmail && (
                  <a
                    href={`mailto:${activeCancellationModal.customerEmail}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium hover:underline"
                    style={{ color: "var(--text2)" }}
                  >
                    <FiMail className="w-3.5 h-3.5" />
                    <span>{activeCancellationModal.customerEmail}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Booking & Material Info */}
            {activeCancellationModal.booking && (
              <div
                className="p-3.5 rounded-xl border text-xs space-y-1.5"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div className="flex items-center justify-between font-bold">
                  <span style={{ color: "var(--text)" }}>
                    {activeCancellationModal.booking?.goodsData?.title || activeCancellationModal.booking?.goodsData?.material}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ₹{activeCancellationModal.booking?.estimatedAmount?.toLocaleString("en-IN") || "—"}
                  </span>
                </div>
                <p style={{ color: "var(--text3)" }}>
                  {activeCancellationModal.booking?.orderQty} {activeCancellationModal.booking?.goodsData?.unit || "units"} · Status: {activeCancellationModal.booking?.status}
                </p>
                {activeCancellationModal.booking?.deliveryAddress && (
                  <p className="flex items-start gap-1 pt-1 text-[11px]" style={{ color: "var(--text2)" }}>
                    <FiMapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>{activeCancellationModal.booking.deliveryAddress}</span>
                  </p>
                )}
              </div>
            )}

            {/* Customer's Cancellation Reason Box */}
            <div
              className="p-4 rounded-xl border bg-amber-500/5 space-y-1.5"
              style={{ borderColor: "rgba(245, 158, 11, 0.3)" }}
            >
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                <FiAlertCircle className="w-3.5 h-3.5" />
                <span>{tr("Customer's Reason for Cancellation")}</span>
              </div>
              <p className="text-sm font-semibold leading-relaxed" style={{ color: "var(--text)" }}>
                "{activeCancellationModal.reason}"
              </p>
            </div>

            {/* Actions Section */}
            {!showCancelConfirm && !showRejectForm && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                  {tr("Choose Action")}:
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
                  >
                    <FiXCircle className="w-4 h-4" />
                    <span>{tr("Cancel Order")}</span>
                  </button>

                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition cursor-pointer"
                  >
                    <FiTruck className="w-4 h-4" />
                    <span>{tr("Order Already On The Way")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Panel: Confirm Cancel Order */}
            {showCancelConfirm && (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
                  <FiAlertCircle className="w-4 h-4" />
                  <span>{tr("Confirm Order Cancellation")}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>
                  {tr("Cancelling will restore stock inventory, send an approval notification to the user, and automatically move this order to Admin History.")}
                </p>
                <input
                  type="text"
                  placeholder="Optional admin note (e.g. Approved per phone call)"
                  value={cancelAdminNote}
                  onChange={(e) => setCancelAdminNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-white/5 transition"
                    style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                  >
                    {tr("Back")}
                  </button>
                  <button
                    onClick={handleApproveCancelOrder}
                    disabled={acting === activeCancellationModal._id}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {acting === activeCancellationModal._id ? "Processing…" : tr("Yes, Cancel Order & Move to History")}
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Panel: Reject & Send Notification */}
            {showRejectForm && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                  <FiTruck className="w-4 h-4" />
                  <span>{tr("Send Notification to User (Keep Order)")}</span>
                </div>

                {/* Templates */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                    {tr("Quick Notification Templates")}:
                  </p>
                  {REJECT_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectMessage(p)}
                      className={`w-full text-left p-1.5 rounded-lg text-[11px] border transition cursor-pointer ${
                        rejectMessage === p
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-500 font-semibold"
                          : "border-transparent text-[var(--text2)] hover:bg-white/5"
                      }`}
                    >
                      • {p}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border text-xs leading-relaxed"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                  placeholder="Notification message for the user…"
                />

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:bg-white/5 transition"
                    style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                  >
                    {tr("Back")}
                  </button>
                  <button
                    onClick={handleRejectWithNotification}
                    disabled={acting === activeCancellationModal._id || !rejectMessage.trim()}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <FiSend className="w-3 h-3" />
                    <span>{acting === activeCancellationModal._id ? "Sending…" : tr("Send Notification")}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* POPUP 2: CONTACT MESSAGE DETAILS & REPLY MODAL */}
      {/* (WITH FULL BACK NAVIGATION SUPPORT) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeMessageModal && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeMessagePopup();
          }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5 sm:p-6 border glass space-y-4 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto"
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div>
                <h3 className="font-extrabold text-base text-violet-600 dark:text-violet-400">
                  {activeMessageModal.subject}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text3)" }}>
                  From: <span className="font-bold" style={{ color: "var(--text)" }}>{activeMessageModal.name}</span>
                  {" · "}
                  <a href={`mailto:${activeMessageModal.email}`} className="text-blue-500 hover:underline">
                    {activeMessageModal.email}
                  </a>
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text3)" }}>
                  {new Date(activeMessageModal.createdAt).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>

              <button
                type="button"
                onClick={closeMessagePopup}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold hover:bg-white/10 transition cursor-pointer flex-shrink-0"
                style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Message Body */}
            <div
              className="p-4 rounded-xl text-sm leading-relaxed border whitespace-pre-wrap"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
            >
              {activeMessageModal.message}
            </div>

            {/* Reply Composer */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
                {activeMessageModal.reply ? tr("Edit Reply") : tr("Reply to Customer")}:
              </label>
              <textarea
                className="w-full p-3 rounded-xl border text-xs leading-relaxed"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--text)" }}
                rows={3}
                placeholder={`Type your reply to ${activeMessageModal.name}…`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={(e) => handleDeleteMessage(e, activeMessageModal._id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>{tr("Delete Message")}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={closeMessagePopup}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-white/5 transition cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                >
                  {tr("Close")}
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={sendingReply}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs font-bold shadow-md shadow-violet-600/20 hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
                >
                  <FiSend className="w-3.5 h-3.5" />
                  <span>{sendingReply ? tr("Saving…") : tr("Save Reply")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
