import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { useTheme } from "../context/ThemeContext";

export default function FeedbackModal({ booking, user, onClose, onSubmitted }) {
  const [form, setForm] = useState({ customerName: `${user.firstName || ""} ${user.lastName || ""}`.trim(), serviceReview: "", improvement: "", rating: 0 });
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
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6" style={{ background: "var(--bg3)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between mb-5"><div><h2 className="text-xl font-extrabold" style={{ color: "var(--text)" }}>{tr("Share your feedback")}</h2><p className="text-sm mt-1" style={{ color: "var(--text3)" }}>{tr(booking.goodsData?.material)} service</p></div><button onClick={onClose} style={{ color: "var(--text3)" }}>✕</button></div>
        <div className="space-y-4">
          <input className="input !mb-0" placeholder={tr("Your name")} value={form.customerName} onChange={set("customerName")} />
          <textarea className="textarea-field !mb-0" rows={3} placeholder={tr("How was our service?")} value={form.serviceReview} onChange={set("serviceReview")} />
          <textarea className="textarea-field !mb-0" rows={3} placeholder={tr("What should we improve? (optional)")} value={form.improvement} onChange={set("improvement")} />
          <div><p className="text-sm font-semibold mb-2" style={{ color: "var(--text2)" }}>{tr("Your rating")}</p><div className="flex gap-2">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setForm((current) => ({ ...current, rating: star }))} className={`text-4xl leading-none ${star <= form.rating ? "text-amber-400" : "text-gray-400"}`}>★</button>)}</div></div>
        </div>
        <div className="flex justify-end gap-3 mt-6"><button onClick={onClose} className="px-4 py-2 rounded-xl border text-sm" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>{tr("Cancel")}</button><button onClick={submit} disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50">{saving ? tr("Sending...") : tr("Submit feedback")}</button></div>
      </div>
    </div>
  );
}
