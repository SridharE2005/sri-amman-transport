// src/pages/Home.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import API from "../services/api";
import lorry1 from "../assets/lorry1.png";
import lorry2 from "../assets/lorry2.png";
import lorry3 from "../assets/lorry3.jpeg";
import lorry4 from "../assets/lorry4.jpeg";
import lorry5 from "../assets/lorry5.jpeg";
import grass1 from "../assets/grass1.jpeg";
import bricks1 from "../assets/bricks1.jpeg";
import bricks from "../assets/bricks.png";
import msand from "../assets/msand.png";
import riversand from "../assets/riversand.png";
import drygrass from "../assets/drygrass.png";

import BrickCarousel from "../components/BrickCarousel";

function ContactForm({ t }) {
  const [form, setForm]       = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSend = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error("Please fill all fields"); return;
    }
    setSending(true);
    try {
      await API.post("/messages", form);
      toast.success("Message sent! We will get back to you soon.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch { toast.error("Failed to send message"); }
    finally { setSending(false); }
  };

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-0 sm:gap-4">
        <input className="input" placeholder={t.namePh}    value={form.name}    onChange={set("name")} />
        <input className="input" type="email" placeholder={t.emailPh}   value={form.email}   onChange={set("email")} />
      </div>
      <input className="input" placeholder={t.subjectPh} value={form.subject} onChange={set("subject")} />
      <textarea className="textarea-field" rows={4} placeholder={t.msgPh} value={form.message} onChange={set("message")} />
      <button onClick={handleSend} disabled={sending} className="btn-primary disabled:opacity-50">
        {sending ? "Sending…" : t.sendBtn}
      </button>
    </>
  );
}

/* ── Slider data (Salem/TN transport images) ── */
const SLIDES = [
  { url: lorry1, key: 1 },
  { url: lorry2, key: 2 },
  { url: lorry3, key: 3 },
  { url: lorry4, key: 4 },
];

const SERVICE_IMGS = [
  bricks, // bricks
  msand, // m-sand / crushed stone
  drygrass, // dry grass / farm field
  riversand, // river / sand
  "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=600&q=80", // construction site
  "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80", // hay bales / cattle
];

const ABOUT_IMGS = [
  lorry4,
  lorry5,
  grass1,
  bricks1,
];



/* ── Animated counter ── */
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let s = null;
    const step = (ts) => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      setCount(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

function StatCard({ value, suffix, label, icon, animate }) {
  const count = useCounter(value, 2000, animate);
  return (
    <div className="glass p-6 sm:p-8 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-3xl sm:text-4xl font-extrabold mb-1" style={{ color: "var(--text)" }}>
        {animate ? count.toLocaleString() : "0"}{suffix}
      </p>
      <p className="text-sm font-medium" style={{ color: "var(--text3)" }}>{label}</p>
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { t, theme, tr, lang } = useTheme();

  const [drivers, setDrivers] = useState([]);
  const [driversLoading, setDriversLoading] = useState(true);

  /* Slider */
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 400);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => { setCurrent((c) => (c + 1) % SLIDES.length); setFading(false); }, 400);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  /* Stats observer */
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.25 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const targetId = location.hash.slice(1);
    const scrollTimer = setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    }, 0);
    return () => clearTimeout(scrollTimer);
  }, [location.hash]);

  useEffect(() => {
    API.get("/drivers")
      .then(({ data }) => setDrivers(data))
      .catch(() => setDrivers([]))
      .finally(() => setDriversLoading(false));
  }, []);

  const handleGetStarted = () => { if (user) nav("/stocks"); else nav("/login"); };

  const slideKeys = ["1","2","3","4"];
  const slide = SLIDES[current];
  const sk = slideKeys[current];

  const overlayFrom = theme === "dark" ? "var(--bg)" : "rgba(245,247,255,0.97)";
  const overlayMid  = theme === "dark" ? "rgba(15,15,26,0.80)" : "rgba(245,247,255,0.75)";

  const stats = [
    { value: 15, suffix: "+",    label: t.stat1, icon: "🏆" },
    { value: 500, suffix: "+",  label: t.stat2, icon: "😊" },
    { value: 10, suffix: "",   label: t.stat3, icon: "🚛" },
    { value: 10000, suffix: "+", label: t.stat4, icon: "📦" },
  ];

  const services = [
    { img: SERVICE_IMGS[0], title: t.s1t, desc: t.s1d, badge: "Bricks" },
    { img: SERVICE_IMGS[1], title: t.s2t, desc: t.s2d, badge: "M-Sand" },
    { img: SERVICE_IMGS[2], title: t.s3t, desc: t.s3d, badge: "Grass" },
    { img: SERVICE_IMGS[3], title: t.s4t, desc: t.s4d, badge: "River Sand" },
    
  ];

  return (
    <div className="min-h-screen min-w-0 overflow-x-clip" style={{ background: "var(--bg)" }}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--blob1)" }} />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "var(--blob2)" }} />
      </div>

      <Navbar />

      {/* ══ HERO / SLIDER ══ */}
      <section id="hero" className="relative w-full overflow-hidden" style={{ minHeight: "calc(100vh - 64px)" }}>
        <div className={`absolute inset-0 transition-opacity duration-500 ${fading ? "opacity-0" : "opacity-100"}`}>
          <img src={slide.url} alt="transport" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${overlayFrom}, ${overlayMid}, transparent)` }} />
          <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${overlayFrom}, transparent 60%)` }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-center h-full py-20 sm:py-28">
          <div className={`max-w-2xl transition-all duration-500 ${fading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs sm:text-sm font-medium mb-5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {t[`slide${sk}tag`]}
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4" style={{ color: "var(--text)" }}>
              {t[`slide${sk}title`]}{" "}
              <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                {t[`slide${sk}accent`]}
              </span>
            </h1>
            <p className="text-base sm:text-lg mb-8 leading-relaxed" style={{ color: "var(--text2)" }}>
              {t[`slide${sk}sub`]}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGetStarted}
                className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/30 text-sm sm:text-base"
              >
                {user ? t.viewStocks : t.getStarted}
              </button>
              <button
                onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })}
                className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl border font-semibold hover:bg-blue-500/5 transition text-sm sm:text-base"
                style={{ borderColor: "var(--border)", color: "var(--text2)" }}
              >
                {t.learnMore}
              </button>
            </div>
          </div>

          {/* Dots */}
          <div className="flex gap-2 mt-10">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { clearInterval(timerRef.current); goTo(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-8 bg-blue-500" : "w-3 bg-white/20 hover:bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 right-6 z-10 text-sm font-mono hidden sm:block" style={{ color: "var(--text3)" }}>
          {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
        </div>
      </section>

      {/* ══ ABOUT ══ */}
      <section id="about" className="relative py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid min-w-0 lg:grid-cols-2 gap-12 items-center">
            {/* Image collage */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                {ABOUT_IMGS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="transport"
                    className={`rounded-2xl w-full object-cover ${i % 2 !== 0 ? "mt-6" : ""} ${i < 2 ? "h-48 sm:h-64" : "h-36 sm:h-48"}`}
                  />
                ))}
              </div>
              <div className="absolute -bottom-4 -right-4 glass px-5 py-3 hidden sm:block">
                <p className="font-bold text-lg" style={{ color: "var(--text)" }}>15+ {t.yearsLabel}</p>
                <p className="text-xs" style={{ color: "var(--text3)" }}>Salem, Tamil Nadu</p>
              </div>
            </div>

            {/* Text */}
            <div>
              <span className="section-tag">{t.aboutTag}</span>
              <h2 className="section-title" style={{ whiteSpace: "pre-line" }}>{t.aboutTitle}</h2>
              <p className="text-base leading-relaxed mb-5" style={{ color: "var(--text2)" }}>{t.aboutP1}</p>
              <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text2)" }}>{t.aboutP2}</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: "📍", text: t.badge1 },
                  { icon: "🛡️", text: t.badge2 },
                  { icon: "🗺️", text: t.badge3 },
                  { icon: "⚡", text: t.badge4 },
                ].map(({ icon, text }) => (
                  <div key={text} className="glass flex items-center gap-3 px-4 py-3">
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-medium" style={{ color: "var(--text2)" }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ OWNER ══ */}
      <section id="owner" className="py-20 sm:py-28" style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid min-w-0 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="section-tag">{t.ownerTag}</span>
              <h2 className="section-title">{t.ownerTitle}</h2>
              <p className="text-base leading-relaxed mb-5 text-justify" style={{ color: "var(--text2)" }}>{t.ownerBio}</p>
              <p className="text-base leading-relaxed mb-8" style={{ color: "var(--text2)" }}>
                
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-2xl">
                  🌟
                </div>
                <div>
                  <h4 className="font-bold text-lg" style={{ color: "var(--text)" }}>Elumalai A</h4>
                  <p className="text-sm" style={{ color: "var(--text3)" }}>{t.ownerRole}</p>
                </div>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-2xl relative">
                <img src="../asserts/owner.png" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section id="stats" ref={statsRef} className="py-16 sm:py-20" style={{ background: "var(--stats-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="section-tag">{t.statsTag}</span>
            <h2 className="section-title">{t.statsTitle}</h2>
            <p className="section-sub">{t.statsSub}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s) => <StatCard key={s.label} {...s} animate={statsVisible} />)}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section id="services" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="section-tag">{t.servicesTag}</span>
            <h2 className="section-title">{t.servicesTitle}</h2>
            <p className="section-sub">{t.servicesSub}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map(({ img, title, desc, badge }) => (
              <div key={title} className="glass overflow-hidden group hover:border-blue-500/40 transition-all duration-300" style={{ borderColor: "var(--border)" }}>
                <div className="relative overflow-hidden h-48">
                  <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0" style={{ background: "var(--card-img-overlay)" }} />
                  <span className="absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full bg-blue-600/80 text-white backdrop-blur-sm">
                    {badge}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-blue-500 transition-colors" style={{ color: "var(--text)" }}>{title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text3)" }}>{desc}</p>
                  <button onClick={handleGetStarted} className="text-blue-500 text-sm font-semibold hover:text-blue-400 transition flex items-center gap-1">
                    {t.bookNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY CHOOSE US ══ */}
      <section id="why-choose-us" className="py-20 sm:py-28 relative overflow-hidden" style={{ background: "var(--stats-bg)", borderTop: "1px solid var(--border)" }}>
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-3xl pointer-events-none -z-0 opacity-20" style={{ background: "linear-gradient(135deg, var(--accent), #8b5cf6)" }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="section-tag">{lang === "ta" ? "சிறப்புகள்" : "WHY CHOOSE US"}</span>
            <h2 className="section-title">
              {lang === "ta" ? "நீங்கள் ஏன் எங்களை தேர்ந்தெடுக்க வேண்டும்?" : "Why You Want to Choose Us"}
            </h2>
            <p className="section-sub">
              {lang === "ta"
                ? "நம்பகமான லாரி போக்குவரத்து, நேரடி தயாரிப்பாளர் தரம் மற்றும் வெளிப்படையான கட்டணங்கள் — உங்கள் கட்டுமானத்தின் சிறந்த பங்குதாரர்."
                : "Trusted heavy goods transport and direct quarry material supply across Tamil Nadu with unmatched punctuality, verified drivers, and honest pricing."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-14">
            {[
              {
                icon: "⚡",
                title: lang === "ta" ? "சரியான நேரத்தில் டெலிவரி" : "Guaranteed On-Time Delivery",
                desc: lang === "ta"
                  ? "திட்டமிட்ட நேரத்தில் கட்டுமானப் பொருட்கள் தளத்திற்கு வந்து சேர்வதை எங்கள் அனுபவமிக்க ஓட்டுனர்கள் உறுதி செய்கின்றனர்."
                  : "We respect your project deadlines. Scheduled dispatches ensure materials arrive at your site on time without labor delays.",
                color: "from-amber-500/20 to-orange-500/10",
                badge: lang === "ta" ? "100% நேரக்கட்டுப்பாடு" : "Punctual",
              },
              {
                icon: "🛡️",
                title: lang === "ta" ? "சரிபார்க்கப்பட்ட ஓட்டுநர்கள்" : "Verified Professional Drivers",
                desc: lang === "ta"
                  ? "10+ வருட அனுபவமிக்க உரிமம் பெற்ற தொழில்முறை கனரக ஓட்டுனர்கள் மூலம் பாதுகாப்பான போக்குவரத்து."
                  : "All our drivers are verified professionals with over a decade of heavy lorry steering experience across Tamil Nadu.",
                color: "from-emerald-500/20 to-teal-500/10",
                badge: lang === "ta" ? "நம்பகமானது" : "Verified",
              },
              {
                icon: "🧱",
                title: lang === "ta" ? "உயர்தர மூலப்பொருட்கள்" : "Direct Sourced High Quality",
                desc: lang === "ta"
                  ? "சேலம் மற்றும் சுற்றுவட்டார அங்கீகரிக்கப்பட்ட சூளைகளிலிருந்தும் குவாரிகளிலிருந்தும் நேரடியாக கொள்முதல் செய்யப்படுகிறது."
                  : "Direct supply of chamber red bricks, certified M-sand, government-approved river sand, and fresh nutrient-rich grass rolls.",
                color: "from-blue-500/20 to-cyan-500/10",
                badge: lang === "ta" ? "முதல் தரம்" : "A-Grade",
              },
              {
                icon: "💰",
                title: lang === "ta" ? "நேர்மையான மற்றும் நியாயமான விலை" : "Transparent & Fair Pricing",
                desc: lang === "ta"
                  ? "இடைத்தரகர் இல்லாத நேரடி விலைப்பட்டியல். எந்த மறைமுக கட்டணங்களும் இன்றி எளிமையான முன்பதிவு."
                  : "Zero hidden charges, direct quarry-to-site prices, and live per-unit estimation for full lorry loads and custom volumes.",
                color: "from-violet-500/20 to-purple-500/10",
                badge: lang === "ta" ? "இடைத்தரகர் இல்லை" : "Zero Markup",
              },
              {
                icon: "🏅",
                title: lang === "ta" ? "பொருளுக்கான முழு உத்தரவாதம்" : "Guaranteed Product Quality",
                desc: lang === "ta"
                  ? "நாங்கள் வழங்கும் அனைத்து பொருட்களுக்கும் முழு உத்தரவாதம் உண்டு. ஏதேனும் சிக்கல் அல்லது குறைபாடு இருந்தால், நீங்கள் உடனடியாக எங்களை நேரடியாக தொடர்பு கொள்ளலாம்; உடனடி தீர்வு உறுதி செய்யப்படுகிறது."
                  : "We stand 100% behind the quality of our delivered materials. If you encounter any issue or problem, you can contact us directly for immediate assistance and resolution.",
                color: "from-rose-500/20 to-pink-500/10",
                badge: lang === "ta" ? "100% உத்தரவாதம்" : "100% Guarantee",
              },
              {
                icon: "📞",
                title: lang === "ta" ? "24/7 நேரடி தொடர்பு" : "24/7 Direct Contact",
                desc: lang === "ta"
                  ? "நாங்கள் 24 மணி நேரமும் உங்களுக்காக நேரடியாக கிடைக்கிறோம். முன்பதிவு, விசாரணைகள் அல்லது ஏதேனும் கேள்விகளுக்கு எந்த நேரத்திலும் எங்களை தொலைபேசி அல்லது வாட்ஸ்அப் வழியாக நேரடியாக அழைக்கலாம்."
                  : "We are available 24/7 round the clock for you. Reach us directly anytime via phone call or WhatsApp for booking assistance, material inquiries, or immediate delivery updates.",
                color: "from-cyan-500/20 to-blue-500/10",
                badge: lang === "ta" ? "24/7 நேரடி தொடர்பு" : "24/7 Direct Help",
              },
            ].map(({ icon, title, desc, color, badge }) => (
              <div
                key={title}
                className="glass p-6 sm:p-7 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 relative group"
                style={{ borderColor: "var(--border)" }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} border border-white/10 flex items-center justify-center text-2xl shadow-inner`}>
                      {icon}
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg mb-2.5 group-hover:text-blue-500 transition-colors" style={{ color: "var(--text)" }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text3)" }}>
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Call-to-action Card with Book Now Button */}
          <div
            className="rounded-3xl p-8 sm:p-12 relative overflow-hidden border flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(139,92,246,0.12) 100%), var(--surface)",
              borderColor: "rgba(59,130,246,0.25)",
            }}
          >
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {lang === "ta" ? "நேரடி முன்பதிவு" : "Instant Booking Available"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                {lang === "ta" ? "உங்கள் கட்டுமானத் தேவைகளுக்கு இப்போதே முன்பதிவு செய்யுங்கள்" : "Ready to Order Quality Building Materials?"}
              </h3>
              <p className="text-sm sm:text-base mt-2" style={{ color: "var(--text2)" }}>
                {lang === "ta"
                  ? "செங்கற்கள், மணல் அல்லது புல் ரோல்களை சில வினாடிகளில் முன்பதிவு செய்யுங்கள். எங்கள் லாரிகள் உங்கள் இடத்திற்கு வரத் தயார்."
                  : "Book bricks, M-sand, river sand, or dry grass rolls in seconds. Direct delivery guaranteed across Tamil Nadu."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 shrink-0">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-violet-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-500/25 hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>{t.bookNow || "Book Now"}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <a
                href="tel:+919787216797"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border text-sm sm:text-base font-semibold transition hover:bg-white/5 flex items-center justify-center gap-2"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                <span>📞</span>
                <span>{lang === "ta" ? "அழைக்கவும்" : "Call Dispatch"}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ VARIETY OF BRICKS (CAROUSEL) ══ */}
      <section id="bricks" className="py-20 sm:py-28 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="section-tag">{tr("Materials")}</span>
            <h2 className="section-title">{tr("Variety of Bricks")}</h2>
            <p className="section-sub">{tr("Explore our extensive range of high-quality building materials. Click any variety to view full specifications.")}</p>
          </div>

          <BrickCarousel />
        </div>
      </section>

      {/* ══ DRIVERS ══ */}
      <section id="drivers" className="py-20 sm:py-28" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="section-tag">{t.driversTag}</span>
            <h2 className="section-title">{t.driversTitle}</h2>
            <p className="section-sub">{t.driversSub}</p>
          </div>

          {driversLoading ? (
            <p className="text-center text-sm" style={{ color: "var(--text3)" }}>{t.driverLoading}</p>
          ) : drivers.length === 0 ? (
            <p className="text-center text-sm" style={{ color: "var(--text3)" }}>{t.noDrivers}</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {drivers.map((driver) => {
                const statusLabel = driver.status === "On Duty"
                  ? t.driverOnDuty
                  : driver.status === "Off Duty" ? t.driverOffDuty : t.driverAvailable;
                const statusClass = driver.status === "On Duty"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : driver.status === "Off Duty"
                    ? "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/20";

                return (
                  <div key={driver._id} className="glass p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-lg font-bold text-white">
                        {driver.profileImage ? <img src={driver.profileImage} alt={driver.name} className="w-full h-full object-cover" /> : driver.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold truncate" style={{ color: "var(--text)" }}>{driver.name}</h3>
                        <p className="text-xs truncate" style={{ color: "var(--text3)" }}>{driver.vehicle}</p>
                      </div>
                      <span className={`ml-auto flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <a href={`tel:${driver.phone}`} className="flex items-center justify-center gap-2 w-full py-3 mb-4 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20">
                      <span className="text-lg">📞</span> Call {driver.phone}
                    </a>
                    <div className="space-y-2.5 text-sm" style={{ color: "var(--text2)" }}>
                      <p><span className="font-semibold" style={{ color: "var(--text)" }}>Vehicle:</span> {driver.vehicle}</p>
                      <p><span className="font-semibold" style={{ color: "var(--text)" }}>Experience:</span> {driver.experience}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section id="contact" className="py-20 sm:py-28" style={{ background: "var(--stats-bg)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="section-tag">{t.contactTag}</span>
            <h2 className="section-title">{t.contactTitle}</h2>
            <p className="section-sub">{t.contactSub}</p>
          </div>
          <div className="grid min-w-0 lg:grid-cols-2 gap-6 sm:gap-10">
            <div className="min-w-0 space-y-4">
              {[
                { icon: "📍", title: t.officeLabel, detail: t.officeDetail },
                { icon: "📞", title: t.phoneLabel,  detail: t.phoneDetail },
                { icon: "✉️", title: t.emailLabel,  detail: t.emailDetail },
                { icon: "🕐", title: t.hoursLabel,  detail: t.hoursDetail },
              ].map(({ icon, title, detail }) => (
                <div key={title} className="glass flex min-w-0 items-start gap-3 p-4 sm:gap-4 sm:p-5">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--text)" }}>{title}</p>
                    <p className="text-sm break-words" style={{ color: "var(--text3)" }}>{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass min-w-0 p-4 sm:p-8">
              <h3 className="font-bold text-xl mb-6" style={{ color: "var(--text)" }}>{t.formTitle}</h3>
              <ContactForm t={t} />
            </div>
          </div>
        </div>
      </section>



      {/* ══ FOOTER ══ */}
      <footer style={{ background: "var(--footer-bg)", borderTop: "1px solid rgba(255,255,255,0.08)" }} className="pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-lg">🚛</div>
                <div>
                  <p className="font-bold text-white text-sm">Sri Amman Transport</p>
                  <p className="text-xs text-white/40">ஸ்ரீ அம்மன் டிரான்ஸ்போர்ட்</p>
                </div>
              </div>
              <p className="text-white/30 text-sm leading-relaxed mb-5">{t.footerDesc}</p>
              <div className="flex gap-3">
                {["𝕏", "in", "f", "▶"].map((s) => (
                  <div key={s} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white cursor-pointer transition text-sm font-bold">{s}</div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">{t.quickLinks}</p>
              <ul className="space-y-2.5">
                {[t.fl1, t.fl2, t.fl3, t.fl4, ].map((l) => (
                  <li key={l} className="text-white/30 text-sm hover:text-white/70 cursor-pointer transition">{l}</li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <p className="text-white font-semibold text-sm mb-4">{t.footerServices}</p>
              <ul className="space-y-2.5">
                {[t.fs1, t.fs2, t.fs3, t.fs4, t.fs5, t.fs6].map((l) => (
                  <li key={l} className="text-white/30 text-sm hover:text-white/70 cursor-pointer transition" >{l}</li>
                ))}
              </ul>
            </div>

            {/* Legal + App */}
            
          </div>

          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} {t.copyright}</p>
            <p className="text-white/20 text-xs">{t.madeIn}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
