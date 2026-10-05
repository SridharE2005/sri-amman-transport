import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function FeedbackModal({ booking, user, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    customerName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    serviceReview: "",
    improvement: "",
    rating: 0,
  });
  const [saving, setSaving] = useState(false);
  const { tr } = useTheme();
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async () => {
    if (!form.customerName.trim() || !form.serviceReview.trim() || !form.rating) {
      toast.error(tr("Please add your name, review and rating"));
      return;
    }
    setSaving(true);
    try {
      await API.post("/feedback", { bookingId: booking._id, ...form });
      toast.success(tr("Thank you for your feedback"));
      onSubmitted(booking._id);
    } catch (error) {
      toast.error(tr(error.response?.data?.message || "Failed to submit feedback"));
    } finally {
      setSaving(false);
    }
  };

  const materialName = booking?.goodsData?.material || booking?.material || "Service";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-200"
        style={{ background: "var(--card, var(--bg3))", borderColor: "var(--border)", color: "var(--text)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
          <div>
            <h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>
              {tr("Share your feedback")}
            </h2>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text3)" }}>
              {tr(materialName)} {tr("service")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
            style={{ color: "var(--text3)" }}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <input
            className="input !mb-0"
            placeholder={tr("Your name")}
            value={form.customerName}
            onChange={set("customerName")}
          />
          <textarea
            className="textarea-field !mb-0"
            rows={3}
            placeholder={tr("How was our service?")}
            value={form.serviceReview}
            onChange={set("serviceReview")}
          />
          <textarea
            className="textarea-field !mb-0"
            rows={2}
            placeholder={tr("What should we improve? (optional)")}
            value={form.improvement}
            onChange={set("improvement")}
          />
          <div>
            <p className="text-sm font-semibold mb-2" style={{ color: "var(--text2)" }}>
              {tr("Your rating")}
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  aria-label={`${star} star${star > 1 ? "s" : ""}`}
                  onClick={() => setForm((current) => ({ ...current, rating: star }))}
                  className={`text-4xl leading-none transition-transform hover:scale-110 cursor-pointer ${
                    star <= form.rating ? "text-amber-400" : "text-gray-300 dark:text-gray-600"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text2)" }}
          >
            {tr("Cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? tr("Sending...") : tr("Submit feedback")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
