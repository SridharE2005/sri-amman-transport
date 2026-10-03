import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";
import API from "../services/api";
import FeedbackModal from "../components/FeedbackModal";
import EditProfileModal from "../components/EditProfileModal";
import { FiEdit2, FiMail, FiMapPin, FiPhone, FiShield, FiUser } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import CancelBookingModal from "../components/CancelBookingModal";
import RequestCancellationModal from "../components/RequestCancellationModal";
import { getCancellationInfo } from "../utils/cancellationHelper";
import { FiClock, FiAlertCircle, FiHelpCircle } from "react-icons/fi";

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

const getMessage = (booking, tr) => {
  if (booking.status === "Confirmed" || booking.status === "CONFIRMED") return tr("Approved by admin.");
  if (booking.status === "Delivered") return tr("Successfully delivered.");
  if (booking.status === "Rejected" || booking.status === "REJECTED") return `${tr("Rejected")}: ${booking.rejectionReason || tr("No reason provided")}`;
  if (booking.status === "Revoked") return `${tr("Cancelled")}: ${booking.revokedReason || tr("No reason provided")}`;
  if (booking.status === "CANCELLED_BY_USER") return `${tr("Cancelled by you")}: ${booking.cancellationReason || tr("No reason provided")}`;
  if (booking.status === "CANCELLED_BY_ADMIN") return `${tr("Cancelled by admin")}: ${booking.cancellationReason || tr("No reason provided")}`;
  return tr("Waiting for admin approval.");
};

export default function Profile() {
  const { user, loading, updateUser } = useUser();
  const { tr } = useTheme();
  const nav = useNavigate();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [feedbackIds, setFeedbackIds] = useState([]);
  const [feedbackBooking, setFeedbackBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [requestModalBooking, setRequestModalBooking] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!loading && !user) nav("/user-login");
  }, [loading, user, nav]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") {
      setFetching(false);
      return;
    }
    Promise.all([API.get("/bookings/my"), API.get("/feedback/my")])
      .then(([bookingsResponse, feedbackResponse]) => {
        const list = Array.isArray(bookingsResponse.data)
          ? bookingsResponse.data
          : bookingsResponse.data?.data || [];
        setBookings(list);
        const fbList = Array.isArray(feedbackResponse.data) ? feedbackResponse.data : [];
        setFeedbackIds(fbList.map((item) => String(item.booking)));
      })
      .catch(() => toast.error(tr("Failed to load booking history")))
      .finally(() => setFetching(false));
  }, [user]);

  const handleProfileUpdated = (updatedUser) => {
    updateUser(updatedUser);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Page Heading */}
        <div className="mb-8">
          <p className="section-tag">{tr("Your account")}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: "var(--text)" }}>{tr("Profile")}</h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: "var(--text3)" }}>
            {user.role === "admin"
              ? tr("Manage your admin credentials, avatar, and system access.")
              : tr("Manage your profile details, avatar, and review your material bookings.")}
          </p>
        </div>

        {/* Profile Card Section */}
        <section className="glass p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Avatar & Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
              {/* Profile Image loaded from Cloudinary */}
              <div className="relative group">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 shadow-xl transition-transform group-hover:scale-105"
                  style={{ borderColor: "var(--border)", background: "var(--surface)" }}
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.firstName} avatar`}
                      className="w-full h-full object-cover select-none"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-3xl font-bold text-white">
                      {user.firstName?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Floating Edit Icon Badge */}
                <button
                  onClick={() => setIsEditOpen(true)}
                  title={tr("Change Avatar")}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 cursor-pointer"
                >
                  <FiEdit2 className="text-xs" />
                </button>
              </div>

              {/* Details */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                  <h2 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text)" }}>
                    {user.firstName} {user.lastName}
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      user.role === "admin"
                        ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Verified Customer"}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-start gap-x-4 gap-y-1 text-sm" style={{ color: "var(--text3)" }}>
                  <p className="flex items-center gap-1.5">
                    <FiMail className="text-xs" />
                    <span>{user.email}</span>
                  </p>
                  {user.phoneNumber ? (
                    <p className="flex items-center gap-1.5">
                      <FiPhone className="text-xs" />
                      <span>{user.phoneNumber}</span>
                    </p>
                  ) : (
                    <p className="text-xs italic text-gray-500">
                      (No phone added)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
              <button
                onClick={() => setIsEditOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-500/20 transition-all duration-200 cursor-pointer"
              >
                <FiEdit2 className="text-sm" />
                <span>{tr("Edit Profile")}</span>
              </button>

              {user.role === "admin" && (
                <button
                  onClick={() => nav("/admin")}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 text-sm font-semibold transition cursor-pointer"
                >
                  <FiShield className="text-sm" />
                  <span>{tr("Admin Dashboard")}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Booking History (Only for regular customers) */}
        {user.role !== "admin" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{tr("Booking history")}</h2>
                <p className="text-sm mt-1" style={{ color: "var(--text3)" }}>{tr("All your material booking requests and decisions.")}</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => nav("/booking-history")}
                  className="px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 transition cursor-pointer"
                >
                  {tr("Full history")} →
                </button>
                <button
                  onClick={() => nav("/stocks")}
                  className="px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold hover:bg-white/5 transition cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                >
                  {tr("New booking")}
                </button>
              </div>
            </div>

            {fetching ? (
              <p className="py-10 text-center" style={{ color: "var(--text3)" }}>{tr("Loading history...")}</p>
            ) : bookings.length === 0 ? (
              <div className="glass p-10 text-center rounded-2xl" style={{ color: "var(--text3)" }}>{tr("No bookings yet.")}</div>
            ) : (
              <div
                className="rounded-2xl border overflow-hidden shadow-xs"
                style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr
                        className="border-b"
                        style={{ borderColor: "var(--border)", background: "var(--card, var(--bg3))" }}
                      >
                        <th
                          className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap"
                          style={{ color: "var(--text3)" }}
                        >
                          {tr("Booking ID")}
                        </th>
                        <th
                          className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap"
                          style={{ color: "var(--text3)" }}
                        >
                          {tr("Material & Title")}
                        </th>
                        <th
                          className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap"
                          style={{ color: "var(--text3)" }}
                        >
                          {tr("Quantity")}
                        </th>
                        <th
                          className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap"
                          style={{ color: "var(--text3)" }}
                        >
                          {tr("Date")}
                        </th>
                        <th
                          className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap"
                          style={{ color: "var(--text3)" }}
                        >
                          {tr("Status")}
                        </th>
                        <th
                          className="py-3 px-3.5 font-bold uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap text-right"
                          style={{ color: "var(--text3)" }}
                        >
                          {tr("Action")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {bookings.map((booking) => {
                        const cancelInfo = getCancellationInfo(booking, now);
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
                            className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-3.5 font-mono text-xs font-bold text-violet-600 dark:text-violet-400 whitespace-nowrap">
                              {bId}
                            </td>
                            <td className="py-3 px-3.5 min-w-[140px] whitespace-nowrap">
                              <span className="font-bold text-sm block" style={{ color: "var(--text)" }}>
                                {tr(booking.goodsData?.material || "Material")}
                              </span>
                              <span
                                className="text-[11px] block truncate max-w-[180px]"
                                style={{ color: "var(--text3)" }}
                              >
                                {booking.goodsData?.title || "Booking"}
                              </span>
                            </td>
                            <td
                              className="py-3 px-3.5 font-bold text-xs whitespace-nowrap"
                              style={{ color: "var(--text)" }}
                            >
                              <span>{booking.orderQty}</span>
                              {booking.estimatedAmount > 0 && (
                                <p className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                  ₹{booking.estimatedAmount.toLocaleString("en-IN")}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-3.5 text-xs whitespace-nowrap" style={{ color: "var(--text3)" }}>
                              {dateFormatted}
                            </td>
                            <td className="py-3 px-3.5 whitespace-nowrap">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  statusConfig[booking.status] ||
                                  "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                }`}
                              >
                                {getStatusLabel(booking.status, tr)}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right whitespace-nowrap">
                              {/* Actions */}
                              {(booking.status === "Pending" ||
                                booking.status === "PENDING" ||
                                booking.status === "Confirmed" ||
                                booking.status === "CONFIRMED") &&
                                !cancelInfo.isExpired && (
                                  <div className="inline-flex items-center gap-1.5">
                                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                                      {cancelInfo.remainingHoursFormatted}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setCancelModalBooking(booking)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-500/25 transition cursor-pointer"
                                    >
                                      {tr("Cancel")}
                                    </button>
                                  </div>
                                )}
                              {(booking.status === "Pending" ||
                                booking.status === "PENDING" ||
                                booking.status === "Confirmed" ||
                                booking.status === "CONFIRMED") &&
                                cancelInfo.isExpired && (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setRequestModalBooking(booking)}
                                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-500/25 transition cursor-pointer"
                                    >
                                      {tr("Request")}
                                    </button>
                                    <a
                                      href="tel:+919787216797"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                                    >
                                      <FiPhone className="text-xs" />
                                      <span>{tr("Contact")}</span>
                                    </a>
                                  </div>
                                )}
                              {booking.status === "Delivered" && (
                                <button
                                  type="button"
                                  onClick={() => setFeedbackBooking(booking)}
                                  disabled={feedbackIds.includes(booking._id)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
                                >
                                  {tr(
                                    feedbackIds.includes(booking._id)
                                      ? "Feedback sent"
                                      : "Feedback"
                                  )}
                                </button>
                              )}
                              {["CANCELLED_BY_USER", "CANCELLED_BY_ADMIN", "Cancelled by User", "Cancelled by Admin", "Rejected", "Revoked"].includes(
                                booking.status
                              ) && (
                                <button
                                  type="button"
                                  onClick={() => nav("/booking-history")}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium border text-violet-600 dark:text-violet-400 border-violet-500/30 hover:bg-violet-500/10 transition cursor-pointer"
                                >
                                  {tr("Details")}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <EditProfileModal
          isOpen={isEditOpen}
          user={user}
          onClose={() => setIsEditOpen(false)}
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <CancelBookingModal
          booking={cancelModalBooking}
          onClose={() => setCancelModalBooking(null)}
          onCancelled={(updated) => {
            setBookings((current) =>
              current.map((b) => (b._id === updated._id ? { ...b, ...updated } : b))
            );
          }}
        />
      )}

      {/* Exceptional Request Modal */}
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
