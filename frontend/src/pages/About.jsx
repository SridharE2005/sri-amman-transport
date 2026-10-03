import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import lorry4 from "../assets/lorry4.jpeg";
import lorry5 from "../assets/lorry5.jpeg";
import grass1 from "../assets/grass1.jpeg";
import bricks1 from "../assets/bricks1.jpeg";

export default function About() {
  const { t } = useTheme();
  const highlights = [
    { label: t.badge1, image: lorry4 },
    { label: t.badge2, image: lorry5 },
    { label: t.badge3, image: grass1 },
    { label: t.badge4, image: bricks1 },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <span className="section-tag">{t.aboutTag}</span>
            <h1 className="section-title whitespace-pre-line mt-3">{t.aboutTitle}</h1>
            <p className="text-base leading-relaxed mt-6" style={{ color: "var(--text2)" }}>{t.aboutP1}</p>
            <p className="text-base leading-relaxed mt-4" style={{ color: "var(--text3)" }}>{t.aboutP2}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {highlights.map(({ label, image }) => (
              <div key={label} className="glass overflow-hidden">
                <img src={image} alt={label} className="w-full h-36 object-cover" />
                <p className="p-3 text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
