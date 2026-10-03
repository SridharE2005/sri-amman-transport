import { useLoading } from "../context/useLoading";
import { useTheme } from "../context/ThemeContext";
import truckImg from "../assets/sri-amman-transport-truck.png";

export default function GlobalLoading() {
  const loading = useLoading();
  const { tr } = useTheme();

  const isBusy = typeof loading === "object" ? !!loading?.isLoading : !!loading;
  if (!isBusy) return null;

  const rawTitle =
    typeof loading === "object" && loading?.title
      ? loading.title
      : "Loading...";

  const message =
    typeof loading === "object" && loading?.message
      ? loading.message
      : "Please wait while we complete your request.";

  const translatedTitle = tr(rawTitle);
  // Clean trailing dots so animated dots render smoothly without duplicate dots
  const cleanTitle = translatedTitle.replace(/[.…]+$/, "");

  return (
    <div
      className="global-loading"
      role="status"
      aria-live="polite"
      aria-label={translatedTitle}
    >
      <div className="global-loading__panel">
        <span className="global-loading__badge">
          Sri Amman Transport
        </span>

        <div className="global-loading__truck-stage">
          <div className="global-loading__glow" aria-hidden="true" />

          <div className="global-loading__truck-track">
            <div className="global-loading__truck-bounce">
              <img
                src={truckImg}
                alt="Sri Amman Transport Truck"
                className="global-loading__truck-img"
              />
            </div>
            <div className="global-loading__truck-shadow" aria-hidden="true" />
          </div>

          <div className="global-loading__road" aria-hidden="true">
            <div className="global-loading__road-line" />
          </div>
        </div>

        <div className="global-loading__content">
          <h3 className="global-loading__title">
            <span>{cleanTitle}</span>
            <span className="global-loading__dots" aria-hidden="true">
              <span className="dot dot-1">.</span>
              <span className="dot dot-2">.</span>
              <span className="dot dot-3">.</span>
            </span>
          </h3>
          {message && (
            <p className="global-loading__message">{tr(message)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
