import { useLoading } from "../context/useLoading";
import { useTheme } from "../context/ThemeContext";

export default function GlobalLoading() {
  const loading = useLoading();
  const { tr } = useTheme();

  const isBusy = typeof loading === "object" ? !!loading?.isLoading : !!loading;
  if (!isBusy) return null;

  const title = (typeof loading === "object" && loading?.title) ? loading.title : "Working on it";
  const message = (typeof loading === "object" && loading?.message) ? loading.message : "Please wait while we complete your request.";

  return (
    <div className="global-loading" role="status" aria-live="polite" aria-label={title}>
      <div className="global-loading__panel">
        <div className="global-loading__spinner" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="global-loading__title">{tr(title)}</p>
          <p className="global-loading__message">{tr(message)}</p>
        </div>
      </div>
    </div>
  );
}