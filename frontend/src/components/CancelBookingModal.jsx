import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { FiAlertTriangle, FiX } from "react-icons/fi";


const PRESET_REASONS = [
  "Changed my plan",
  "Booked by mistake",
  "Transport no longer required",
  "Price issue",
  "Other",
];

export default function CancelBookingModal({ booking, onClose, onCancelled }) {
  const { tr } = useTheme();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking) return null;

  const bId = booking.bookingId || (booking.booking && booking.booking.bookingId) || booking._id;
  const effectiveReason = selectedReason === "Other" ? customReason.trim() : selectedReason;
  const isReasonValid = Boolean(effectiveReason);

  const handleCancelBooking = async () => {
    if (!isReasonValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await API.patch(`/bookings/${booking._id}/cancel`, {
        reason: effectiveReason,
      });

      toast.success(tr("Booking cancelled successfully"));
      if (onCancelled) {
        onCancelled(response.data?.booking || response.data);
      }
      onClose();
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        tr("Failed to cancel booking. Please try again.");
      toast.error(tr(errMsg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              <FiAlertTriangle />
            </div>
            <div>
              <h2 id="cancel-modal-title" className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {tr("Cancel Booking?")}
              </h2>
              <p className="text-xs font-mono font-semibold text-violet-500 mt-0.5">
                ID: {bId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition disabled:opacity-50"
            aria-label="Close"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          <p className="text-sm font-medium leading-relaxed" style={{ color: "var(--text2)" }}>
            {tr("Are you sure you want to cancel this booking? This action cannot be reversed.")}
          </p>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              {tr("Cancellation Reason")} <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-rose-500/40 border"
              style={{
                background: "var(--input-bg, var(--surface))",
                borderColor: "var(--input-border, var(--border))",
                color: "var(--text)",
              }}
            >
              <option value="" disabled>
                {tr("-- Select reason --")}
              </option>
              {PRESET_REASONS.map((r) => (
                <option key={r} value={r}>
                  {tr(r)}
                </option>
              ))}
            </select>
          </div>

          {/* Custom reason text input if "Other" is selected */}
          {selectedReason === "Other" && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-semibold" style={{ color: "var(--text2)" }}>
                {tr("Enter your reason")} <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={tr("Please explain why you need to cancel...")}
                disabled={isSubmitting}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-rose-500/40 border resize-none"
                style={{
                  background: "var(--input-bg, var(--surface))",
                  borderColor: "var(--input-border, var(--border))",
                  color: "var(--text)",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition border hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
            style={{
              borderColor: "var(--border)",
              color: "var(--text2)",
            }}
          >
            {tr("Keep Booking")}
          </button>

          <button
            type="button"
            onClick={handleCancelBooking}
            disabled={!isReasonValid || isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{tr("Cancelling...")}</span>
              </>
            ) : (
              tr("Cancel Booking")
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

