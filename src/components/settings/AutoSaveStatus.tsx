import type { AutoSaveStatus as Status } from "../../hooks/useAutoSave";

interface AutoSaveStatusProps {
  status: Status;
  onRetry: () => void;
}

/** "Saving… / All changes saved / Not saved — Try again" for pages without a Save button. */
export default function AutoSaveStatus({ status, onRetry }: AutoSaveStatusProps) {
  if (status === "idle") {
    return (
      <span className="autosave-status">
        <i className="fa-regular fa-circle-check" aria-hidden="true" /> Changes save automatically
      </span>
    );
  }
  if (status === "saving") {
    return (
      <span className="autosave-status" role="status">
        <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving…
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="autosave-status is-error" role="alert">
        <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> Some changes were not saved.
        <button type="button" className="btn-secondary autosave-retry" onClick={onRetry}>
          Try again
        </button>
      </span>
    );
  }
  return (
    <span className="autosave-status is-saved" role="status">
      <i className="fa-solid fa-circle-check" aria-hidden="true" /> All changes saved
    </span>
  );
}
