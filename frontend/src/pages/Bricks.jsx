import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { BRICK_VARIETIES } from "../data/brickVarieties";
import { FaWhatsapp, FaPhoneAlt, FaSearch } from "react-icons/fa";

export default function Bricks() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { tr, t } = useTheme();

  const [search, setSearch] = useState("");
  const [selectedBrick, setSelectedBrick] = useState(null);

  useEffect(() => {
    if (location.state?.selectedBrickId) {
      const found = BRICK_VARIETIES.find((b) => b.id === location.state.selectedBrickId);
      if (found) {
        setSelectedBrick(found);
        setTimeout(() => {
          document.getElementById(`brick-${location.state.selectedBrickId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.state]);

  const filteredBricks = BRICK_VARIETIES.filter((brick) =>
    brick.name.toLowerCase().includes(search.toLowerCase()) ||
    brick.code.toLowerCase().includes(search.toLowerCase()) ||
    brick.desc.toLowerCase().includes(search.toLowerCase())
  );

  const handleBookNow = () => {
    if (user) {
      nav("/stocks");
    } else {
      nav("/login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Ambient background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--blob1)" }} />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--blob2)" }} />
      </div>

      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full relative z-10">
        {/* Back navigation & Header */}
        <div className="mb-10">
          <button
            onClick={() => nav("/")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-500 hover:text-blue-400 transition mb-6 cursor-pointer"
          >
            <span>←</span> {tr("Back to Home")}
          </button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b" style={{ borderColor: "var(--border)" }}>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold uppercase tracking-wider mb-3">
                {tr("Building Materials")} · {BRICK_VARIETIES.length} {tr("Varieties")}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold" style={{ color: "var(--text)" }}>
                {tr("Variety of Bricks")}
              </h1>
              <p className="text-sm sm:text-base mt-2 max-w-2xl leading-relaxed" style={{ color: "var(--text3)" }}>
                {tr("Explore our complete collection of certified first-grade red clay chamber bricks for high-strength foundations, partition walls, and commercial projects.")}
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tr("Search by brick name (e.g. A2B, CSK)...")}
                className="input !mb-0 !pl-11"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-medium" style={{ color: "var(--text3)" }}>
            {tr("Showing")} <span className="font-bold" style={{ color: "var(--text)" }}>{filteredBricks.length}</span> {tr("brick varieties")}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs text-blue-500 hover:underline"
            >
              {tr("Clear filter")}
            </button>
          )}
        </div>

        {/* Bricks Grid */}
        {filteredBricks.length === 0 ? (
          <div className="glass text-center py-16 px-4 rounded-2xl">
            <p className="text-4xl mb-3">🧱</p>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>{tr("No bricks found")}</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text3)" }}>
              {tr("No variety matches")} &ldquo;{search}&rdquo;. {tr("Try searching for another keyword.")}
            </p>
            <button onClick={() => setSearch("")} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition">
              {tr("View All Bricks")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBricks.map((brick) => {
              const isSelected = selectedBrick?.id === brick.id || location.state?.selectedBrickId === brick.id;
              return (
                <div
                  id={`brick-${brick.id}`}
                  key={brick.id}
                  onClick={() => setSelectedBrick(brick)}
                  className={`glass rounded-2xl overflow-hidden cursor-pointer group hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-1.5 shadow-lg flex flex-col ${
                    isSelected ? "ring-2 ring-blue-500 shadow-blue-500/30" : ""
                  }`}
                  style={{ borderColor: "var(--border)" }}
                >
                  {/* Image */}
                  <div className="h-48 sm:h-52 overflow-hidden relative">
                    <img
                      src={brick.img}
                      alt={brick.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,15,26,0.6) 0%, transparent 60%)" }} />
                    <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-600/90 text-white backdrop-blur-sm shadow">
                      {brick.code}
                    </span>
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow">
                        {tr("Selected")}
                      </span>
                    )}
                  </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors" style={{ color: "var(--text)" }}>
                      {brick.name}
                    </h3>
                    <p className="text-xs mb-1.5 font-medium text-blue-500/90">
                      {brick.category}
                    </p>
                    {brick.strength && (
                      <p className="text-[11px] font-semibold text-emerald-400 mb-2 flex items-center gap-1">
                        <span>🛡️</span>
                        <span>{brick.strength}</span>
                      </p>
                    )}
                    <p className="text-xs line-clamp-2 leading-relaxed mb-4" style={{ color: "var(--text3)" }}>
                      {brick.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBrick(brick);
                      }}
                      className="text-xs text-blue-500 font-semibold hover:underline"
                    >
                      {tr("View Details")} →
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookNow();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-500/20"
                    >
                      {tr("Book Now")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </main>

      {/* ══ BRICK MODAL ══ */}
      {selectedBrick && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setSelectedBrick(null)}
        >
          <div
            className="glass max-w-lg w-full overflow-hidden relative animate-fade-up rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "var(--bg3)", borderColor: "var(--border)" }}
          >
            <button
              onClick={() => setSelectedBrick(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition z-10 font-bold"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="h-64 sm:h-72 w-full relative overflow-hidden">
              <img
                src={selectedBrick.img}
                alt={selectedBrick.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg3) 0%, transparent 60%)" }} />
              <span className="absolute bottom-4 left-5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow">
                {selectedBrick.code} · {tr("First Quality")}
              </span>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
                {selectedBrick.name}
              </h3>
              <p className="text-sm font-semibold text-blue-500 mb-3">
                {selectedBrick.category} · {selectedBrick.strength}
              </p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text2)" }}>
                {selectedBrick.desc}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text3)" }}>{tr("Type")}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text)" }}>Chamber Burnt</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text3)" }}>{tr("Quality")}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text)" }}>Grade 1 Certified</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBrick(null)}
                  className="flex-1 py-3 rounded-xl border font-semibold hover:bg-blue-500/10 transition text-sm"
                  style={{ borderColor: "var(--border)", color: "var(--text2)" }}
                >
                  {tr("Close")}
                </button>
                <button
                  onClick={handleBookNow}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold transition shadow-lg shadow-blue-500/25 text-sm"
                >
                  {user ? tr("Book Goods") : tr("Login to Book")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Footer */}
      <footer style={{ background: "var(--footer-bg)", borderTop: "1px solid rgba(255,255,255,0.08)" }} className="py-6 mt-16 text-center">
        <p className="text-white/30 text-xs">© {new Date().getFullYear()} Sri Amman Transport. All rights reserved.</p>
      </footer>
    </div>
  );
}
