import { FiArrowLeft, FiCompass } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function NotFound() {
  const nav = useNavigate();
  const { tr } = useTheme();

  return (
    <main className="not-found-page">
      <div className="not-found-page__glow not-found-page__glow--one" />
      <div className="not-found-page__glow not-found-page__glow--two" />
      <section className="not-found-card animate-fade-up" aria-labelledby="not-found-title">
        <div className="not-found-card__icon" aria-hidden="true"><FiCompass /></div>
        <p className="section-tag">{tr("Route unavailable")}</p>
        <p className="not-found-card__code">404</p>
        <h1 id="not-found-title">{tr("This page took a wrong turn.")}</h1>
        <p className="not-found-card__message">{tr("The page you are looking for does not exist or may have moved.")}</p>
        <button type="button" className="btn-primary not-found-card__button" onClick={() => nav("/")}>
          <FiArrowLeft aria-hidden="true" /> {tr("Back to home")}
        </button>
      </section>
    </main>
  );
}