import { useMemo, useState } from "react";
import type { UseMemberImportResult } from "../../hooks/useMemberImport";

interface ImportPreviewModalProps {
  importState: UseMemberImportResult;
  currentUser: string;
  onClose: () => void;
  onImported: () => void;
}

/** Formats an ISO date string (YYYY-MM-DD) as "Jan 01 2002" for display. */
function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`); // avoid timezone shift
  if (isNaN(d.getTime())) return iso; // fallback: show raw value if unparseable
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function ImportPreviewModal({ importState, currentUser, onClose, onImported }: ImportPreviewModalProps) {
  const { step, parseResult, error, progress, confirmImport, reset } = importState;
  const [previewSearch, setPreviewSearch] = useState("");

  const visibleRows = useMemo(() => {
    if (!parseResult) return [];
    const q = previewSearch.trim().toLowerCase();
    if (!q) return parseResult.rows;
    return parseResult.rows.filter((r) =>
      `${r.data.firstName} ${r.data.middleInitial} ${r.data.lastName}`.toLowerCase().includes(q)
    );
  }, [parseResult, previewSearch]);

  function handleClose() {
    reset();
    onClose();
  }

  async function handleConfirm() {
    await confirmImport(currentUser);
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Import Members</h2>

        {step === "parsing" && <p>Reading file…</p>}

        {step === "error" && (
          <>
            <div className="modal-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose}>Close</button>
            </div>
          </>
        )}

        {step === "preview" && parseResult && (
          <>
            <p>
              Found <strong>{parseResult.rows.length}</strong> valid member{parseResult.rows.length !== 1 ? "s" : ""} to import.
              {parseResult.skipped.length > 0 && (
                <> <strong>{parseResult.skipped.length}</strong> row{parseResult.skipped.length !== 1 ? "s" : ""} will be skipped.</>
              )}
            </p>

            <div className="input-wrap import-preview-search">
              <input
                type="text"
                placeholder="Search to spot-check a name…"
                value={previewSearch}
                onChange={(e) => setPreviewSearch(e.target.value)}
              />
            </div>

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Gender</th>
                    <th>Birthday</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.rowNumber}>
                      <td>{r.rowNumber}</td>
                      <td>{r.data.firstName} {r.data.middleInitial} {r.data.lastName}</td>
                      <td>{r.data.gender || "—"}</td>
                      <td>{r.data.birthday ? formatDisplayDate(r.data.birthday) : "—"}</td>
                      <td>{r.data.category || "—"}</td>
                      <td>{r.data.status || "—"}</td>
                    </tr>
                  ))}
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No matches for "{previewSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="import-preview-more">
              Showing {visibleRows.length} of {parseResult.rows.length} row{parseResult.rows.length !== 1 ? "s" : ""} — scroll to see more.
            </p>

            {parseResult.skipped.length > 0 && (
              <details className="import-skipped-details">
                <summary>{parseResult.skipped.length} skipped row{parseResult.skipped.length !== 1 ? "s" : ""} (click to view)</summary>
                <ul>
                  {parseResult.skipped.slice(0, 20).map((s) => (
                    <li key={s.rowNumber}>Row {s.rowNumber}: {s.reason}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={handleConfirm}>
                <i className="fa-solid fa-file-import" aria-hidden="true" />
                Import {parseResult.rows.length} Member{parseResult.rows.length !== 1 ? "s" : ""}
              </button>
            </div>
          </>
        )}

        {step === "importing" && progress && (
          <>
            <p>Importing… {progress.written} / {progress.total}</p>
            <div className="import-progress-bar">
              <div className="import-progress-fill" style={{ width: `${(progress.written / progress.total) * 100}%` }} />
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <div className="import-success">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <p>Import complete!</p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => {
                  onImported();
                  handleClose();
                }}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}