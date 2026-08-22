import { useMemo, useState } from "react";
import type { UseCalendarImportResult } from "../../hooks/useCalendarImport";

interface Props {
  importState: UseCalendarImportResult;
  onClose: () => void;
  /** Called after a successful import so the caller can refetch events + categories. */
  onImported: () => void;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`); // avoid timezone shift
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function CalendarImportPreviewModal({ importState, onClose, onImported }: Props) {
  const { step, parseResult, error, summary, newCategoryLabels, confirmImport, reset } = importState;
  const [search, setSearch] = useState("");

  const visibleRows = useMemo(() => {
    if (!parseResult) return [];
    const q = search.trim().toLowerCase();
    if (!q) return parseResult.rows;
    return parseResult.rows.filter((r) =>
      `${r.data.title} ${r.data.inCharge ?? ""} ${r.data.location ?? ""}`.toLowerCase().includes(q)
    );
  }, [parseResult, search]);

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal calendar-import-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Import Calendar of Activities</h2>

        {step === "parsing" && <p>Reading file…</p>}

        {step === "error" && (
          <>
            <div className="modal-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose}>
                Close
              </button>
            </div>
          </>
        )}

        {step === "preview" && parseResult && (
          <>
            <p>
              Found <strong>{parseResult.rows.length}</strong> activit{parseResult.rows.length !== 1 ? "ies" : "y"} to import.
              {parseResult.skipped.length > 0 && (
                <>
                  {" "}
                  <strong>{parseResult.skipped.length}</strong> row{parseResult.skipped.length !== 1 ? "s" : ""} will be
                  skipped.
                </>
              )}
            </p>

            {newCategoryLabels.length > 0 && (
              <div className="modal-error" style={{ background: "#eef4ff", color: "#2a4d7a", borderColor: "#c7d9f2" }}>
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                {newCategoryLabels.length} new categor{newCategoryLabels.length !== 1 ? "ies" : "y"} will be created:{" "}
                {newCategoryLabels.join(", ")}
              </div>
            )}

            <div className="input-wrap import-preview-search">
              <input
                type="text"
                placeholder="Search to spot-check an activity…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>In-Charge</th>
                    <th>Place</th>
                    <th>Budget</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r, idx) => (
                    <tr key={`${r.rowNumber}-${idx}`}>
                      <td>{r.rowNumber}</td>
                      <td>{formatDisplayDate(r.data.date)}</td>
                      <td>{r.data.title}</td>
                      <td>{r.data.inCharge || "—"}</td>
                      <td>{r.data.location || "—"}</td>
                      <td>{r.data.budget || "—"}</td>
                      <td>{r.data.categoryLabel}</td>
                    </tr>
                  ))}
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No matches for "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="import-preview-more">
              Showing {visibleRows.length} of {parseResult.rows.length} row{parseResult.rows.length !== 1 ? "s" : ""} — scroll
              to see more.
            </p>

            {parseResult.skipped.length > 0 && (
              <details className="import-skipped-details">
                <summary>{parseResult.skipped.length} skipped row{parseResult.skipped.length !== 1 ? "s" : ""} (click to view)</summary>
                <ul>
                  {parseResult.skipped.slice(0, 20).map((s, i) => (
                    <li key={i}>
                      Row {s.rowNumber}: {s.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmImport}>
                <i className="fa-solid fa-file-import" aria-hidden="true" />
                Import {parseResult.rows.length} Activit{parseResult.rows.length !== 1 ? "ies" : "y"}
              </button>
            </div>
          </>
        )}

        {step === "importing" && <p>Creating categories and saving activities…</p>}

        {step === "done" && (
          <>
            <div className="import-success">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <p>Import complete!</p>
              {summary && (
                <ul className="import-summary-list">
                  <li>
                    {summary.written} activit{summary.written !== 1 ? "ies" : "y"} added
                  </li>
                  {summary.categoriesCreated > 0 && (
                    <li>
                      {summary.categoriesCreated} new categor{summary.categoriesCreated !== 1 ? "ies" : "y"} created
                    </li>
                  )}
                </ul>
              )}
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
