import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { FiHelpCircle, FiX, FiSend } from "react-icons/fi";

export default function RequestCancellationModal({ booking, onClose, onRequestSubmitted }) {
  const { tr } = useTheme();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!booking) return null;

  const bId = booking.bookingId || (booking.booking && booking.booking.bookingId) || booking._id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error(tr("Please provide a reason for your cancellation request"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await API.post(`/bookings/${booking._id}/cancellation-request`, {
        reason: trimmed,
      });

      toast.success(
        tr("Cancellation request submitted successfully. Sri Amman Transport support team will review your request.")
      );

      if (onRequestSubmitted) {
        onRequestSubmitted(response.data?.request);
      }
      onClose();
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        tr("Failed to submit cancellation request");
      toast.error(tr(errMsg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(6px)" }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200 border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          color: "var(--text)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              <FiHelpCircle />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {tr("Exceptional Cancellation Request")}
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
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div
            className="p-3.5 rounded-xl border text-xs leading-relaxed"
            style={{
              background: "rgba(245, 158, 11, 0.08)",
              borderColor: "rgba(245, 158, 11, 0.25)",
              color: "var(--text)",
            }}
          >
            <strong className="block font-bold text-amber-600 dark:text-amber-400 mb-1">
              {tr("Cancellation window expired")}
            </strong>
            {tr(
              "The standard 24-hour self-cancellation window has passed. If you have an exceptional reason, please explain below. Our management team will manually review your request."
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text3)" }}>
              {tr("Reason for exceptional cancellation")} <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={tr("Please explain why this booking needs to be cancelled after the 24-hour window...")}
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-amber-500/40 border resize-none"
              style={{
                background: "var(--input-bg, var(--surface))",
                borderColor: "var(--input-border, var(--border))",
                color: "var(--text)",
              }}
            />
          </div>

          {/* Footer */}
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
              {tr("Cancel")}
            </button>

            <button
              type="submit"
              disabled={!reason.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{tr("Submitting...")}</span>
                </>
              ) : (
                <>
                  <FiSend className="text-xs" />
                  <span>{tr("Submit Request")}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
