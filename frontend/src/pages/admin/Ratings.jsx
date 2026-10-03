import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useTheme } from "../../context/ThemeContext";

export default function Ratings() {
    const { tr } = useTheme();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    API.get("/feedback")
      .then(({ data }) => setRatings(data))
      .catch(() => toast.error(tr("Failed to load ratings")))
      .finally(() => setLoading(false));
  }, []);

  const filtered = ratings.filter((rating) => {
    const matchesRating = filter === "All" || rating.rating === Number(filter);
    const text = `${rating.customerName} ${rating.serviceReview} ${rating.booking?.material || ""}`.toLowerCase();
    return matchesRating && text.includes(search.toLowerCase());
  });
  const average = ratings.length ? (ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length).toFixed(1) : "0.0";

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-6 px-4 sm:px-6 py-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <div><p className="section-tag">{tr("Customer voice")}</p><h1 className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>{tr("Ratings")}</h1><p className="text-sm mt-1" style={{ color: "var(--text3)" }}>{tr("Review the feedback submitted after delivery.")}</p></div>
        <div className="glass px-5 py-3"><span className="text-2xl font-black text-amber-400">{average} ★</span><span className="text-xs ml-2" style={{ color: "var(--text3)" }}>{ratings.length} {tr("reviews")}</span></div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-between"><div className="flex gap-2">{["All", 5, 4, 3, 2, 1].map((value) => <button key={value} onClick={() => setFilter(String(value))} className={`px-3 py-2 rounded-xl border text-sm font-bold ${filter === String(value) ? "bg-violet-600 text-white border-violet-600" : ""}`} style={filter === String(value) ? {} : { borderColor: "var(--border)", color: "var(--text2)" }}>{value === "All" ? tr("All") : `${value}★`}</button>)}</div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tr("Search ratings...")} className="sm:w-72 px-4 py-2 rounded-xl text-sm" style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", color: "var(--input-text)" }} /></div>
      {loading ? <p className="py-16 text-center" style={{ color: "var(--text3)" }}>{tr("Loading ratings...")}</p> : filtered.length === 0 ? <div className="glass p-12 text-center" style={{ color: "var(--text3)" }}>{tr("No ratings found.")}</div> : <div className="space-y-3">{filtered.map((rating) => <article key={rating._id} className="glass p-5"><div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"><div><h2 className="font-bold" style={{ color: "var(--text)" }}>{rating.customerName}</h2><p className="text-xs mt-1" style={{ color: "var(--text3)" }}>{tr(rating.booking?.material || "Service")} · {new Date(rating.createdAt).toLocaleDateString("en-IN")}</p></div><span className="text-xl tracking-widest text-amber-400">{"★".repeat(rating.rating)}<span className="text-gray-400">{"★".repeat(5 - rating.rating)}</span></span></div><p className="mt-4 text-sm" style={{ color: "var(--text2)" }}>{rating.serviceReview}</p>{rating.improvement && <p className="mt-2 text-sm" style={{ color: "var(--text3)" }}><strong style={{ color: "var(--text2)" }}>{tr("Improve")}:</strong> {rating.improvement}</p>}</article>)}</div>}
    </div>
  );
}
