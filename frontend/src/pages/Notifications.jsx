import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { NotificationsSkeleton } from "../components/AdminSkeletons";

const statusConfig = {
  Pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  Confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  Rejected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  Revoked: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  Delivered: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  CANCELLED_BY_USER: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  CANCELLED_BY_ADMIN: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  CANCELLATION_REQUEST_APPROVED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  CANCELLATION_REQUEST_REJECTED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

const getMessage = (notification, tr) => {
  if (notification.status === "Confirmed") return `${tr("Approved by admin.")} ${tr("Your assigned driver details are below.")}`;
  if (notification.status === "Delivered") return tr("Successfully delivered.");
  if (notification.status === "Rejected") return `${tr("Rejected")}: ${notification.reason || tr("No reason provided")}`;
  if (notification.status === "Revoked") return `${tr("Cancelled")}: ${notification.reason || tr("No reason provided")}`;
  if (notification.status === "CANCELLED_BY_USER") return `${tr("Cancelled by you")}: ${notification.reason || tr("No reason provided")}`;
  if (notification.status === "CANCELLED_BY_ADMIN") return `${tr("Cancelled by admin")}: ${notification.reason || tr("Admin approved cancellation")}`;
  if (notification.status === "CANCELLATION_REQUEST_APPROVED") return `${tr("Your exceptional cancellation request was approved.")} ${notification.reason || ""}`;
  if (notification.status === "CANCELLATION_REQUEST_REJECTED") return `${tr("Your exceptional cancellation request was rejected.")} ${notification.reason ? `Reason: ${notification.reason}` : ""}`;
  return tr("Waiting for admin approval.");
};

const getEstimatedAmount = (notification) => {
  return Number(notification.estimatedAmount) || 0;
};

export default function Notifications() {
  const { user, loading } = useUser();
  const { tr } = useTheme();
  const nav = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [submittedFeedback, setSubmittedFeedback] = useState([]);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ customerName: "", serviceReview: "", improvement: "", rating: 0 });
  const [feedbackSaving, setFeedbackSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav("/user-login");
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    Promise.all([API.get("/notifications/my"), API.get("/feedback/my")])
      .then(([notificationsResponse, feedbackResponse]) => {
        const raw = notificationsResponse.data || [];
        // Deduplicate defensively so nothing ever shows twice
        const seen = new Set();
        const unique = [];
        for (const item of raw) {
          const key = String(item.booking?._id || item.booking || item.bookingId || item._id);
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        setNotifications(unique);
        setSubmittedFeedback(feedbackResponse.data?.map((feedback) => String(feedback.booking)) || []);

        // User is viewing notifications now -> clear count indication
        try {
          localStorage.setItem(`notifications_last_viewed_${user._id}`, Date.now().toString());
          window.dispatchEvent(new Event("notifications_viewed"));
          API.put("/notifications/mark-read", {}, { skipLoading: true, silent: true }).catch(() => {});
        } catch {}
      })
      .catch(() => toast.error(tr("Failed to load notifications")))
      .finally(() => setFetching(false));
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  if (loading || !user) return null;

  const recentNotifications = notifications
    .filter((notification) => now - new Date(notification.updatedAt).getTime() <= 24 * 60 * 60 * 1000)
    .sort((first, second) => new Date(second.updatedAt) - new Date(first.updatedAt));

  const openFeedback = (notification) => {
    setFeedbackBooking(notification);
    setFeedbackForm({ customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim(), serviceReview: "", improvement: "", rating: 0 });
  };

  const submitFeedback = async () => {
    if (!feedbackForm.customerName.trim() || !feedbackForm.serviceReview.trim() || !feedbackForm.rating) {
      toast.error(tr("Please add your name, review and rating"));
      return;
    }
    setFeedbackSaving(true);
    try {
      await API.post("/feedback", { bookingId: feedbackBooking.booking, ...feedbackForm, rating: feedbackForm.rating });
      setSubmittedFeedback((current) => [...current, feedbackBooking.booking]);
      setFeedbackBooking(null);
      toast.success(tr("Thank you for your feedback"));
    } catch (error) {
      toast.error(tr(error.response?.data?.message || "Failed to submit feedback"));
    } finally { setFeedbackSaving(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-tag">{tr("Updates")}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--text)" }}>{tr("Notifications")}</h1>
            <p className="mt-2" style={{ color: "var(--text3)" }}>{tr("Booking updates from the last 24 hours.")}</p>
          </div>
          <button onClick={() => nav("/profile")} className="hidden sm:block px-4 py-2.5 rounded-xl border text-sm font-semibold" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>{tr("Profile")}</button>
        </div>

        {fetching ? (
          <NotificationsSkeleton />
        ) : recentNotifications.length === 0 ? (
          <div className="glass p-12 text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-bold" style={{ color: "var(--text)" }}>{tr("No new notifications")}</p>
            <p className="text-sm mt-2" style={{ color: "var(--text3)" }}>{tr("New booking decisions will appear here for 24 hours.")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <article key={notification._id} className="glass p-5">
                {(() => {
                  const estimatedAmount = getEstimatedAmount(notification);
                  return (
                    <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold truncate" style={{ color: "var(--text)" }}>{tr(notification.material || "Booking update")}</h2>
                      {(notification.bookingId || notification.booking?.bookingId) && (
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          {notification.bookingId || notification.booking?.bookingId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text3)" }}>{new Date(notification.updatedAt).toLocaleString("en-IN")}</p>
                  </div>
                  <span className={`flex-shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${statusConfig[notification.status] || ""}`}>{tr(notification.status === "Delivered" ? "Successfully Delivered" : notification.status)}</span>
                </div>
                <p className="text-sm mt-4" style={{ color: "var(--text2)" }}>{getMessage(notification, tr)}</p>
                {estimatedAmount > 0 && (
                  <p className="text-sm mt-3 font-bold text-emerald-600 dark:text-emerald-400">
                    Estimated total: ₹{estimatedAmount.toLocaleString("en-IN")}
                  </p>
                )}
                {notification.status === "Confirmed" && notification.driverData && (
                  <div className="mt-4 rounded-xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>Assigned driver</p>
                    <p className="font-bold mt-1" style={{ color: "var(--text)" }}>{notification.driverData.name}</p>
                    <p className="text-sm mt-1" style={{ color: "var(--text2)" }}>{notification.driverData.vehicle}</p>
                    {notification.driverData.phone && (
                      <a href={`tel:${notification.driverData.phone}`} className="inline-flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold">
                        Call {notification.driverData.phone}
                      </a>
                    )}
                  </div>
                )}
                {notification.status === "Delivered" && (
                  <button disabled={submittedFeedback.includes(notification.booking)} onClick={() => openFeedback(notification)} className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">
                    {submittedFeedback.includes(notification.booking) ? "Feedback submitted" : "Give feedback"}
                  </button>
                )}
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </main>
      {feedbackBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}>
            <div className="flex items-start justify-between mb-5"><div><h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>Share your feedback</h2><p className="text-sm mt-1" style={{ color: "var(--text3)" }}>{feedbackBooking.material} service</p></div><button onClick={() => setFeedbackBooking(null)} style={{ color: "var(--text3)" }}>✕</button></div>
            <div className="space-y-4">
              <input className="input !mb-0" placeholder="Your name" value={feedbackForm.customerName} onChange={(event) => setFeedbackForm((current) => ({ ...current, customerName: event.target.value }))} />
              <textarea className="textarea-field !mb-0" rows={3} placeholder="How was our service?" value={feedbackForm.serviceReview} onChange={(event) => setFeedbackForm((current) => ({ ...current, serviceReview: event.target.value }))} />
              <textarea className="textarea-field !mb-0" rows={3} placeholder="What should we improve? (optional)" value={feedbackForm.improvement} onChange={(event) => setFeedbackForm((current) => ({ ...current, improvement: event.target.value }))} />
              <div><p className="text-sm font-semibold mb-2" style={{ color: "var(--text2)" }}>Your rating</p><div className="flex gap-2">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" aria-label={`${star} star${star > 1 ? "s" : ""}`} onClick={() => setFeedbackForm((current) => ({ ...current, rating: star }))} className={`text-4xl leading-none transition ${star <= feedbackForm.rating ? "text-amber-400" : "text-gray-400"}`}>★</button>)}</div></div>
            </div>
            <div className="flex justify-end gap-3 mt-6"><button onClick={() => setFeedbackBooking(null)} className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Cancel</button><button onClick={submitFeedback} disabled={feedbackSaving} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{feedbackSaving ? "Sending..." : "Submit feedback"}</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
