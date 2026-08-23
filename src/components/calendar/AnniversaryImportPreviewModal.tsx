import { useMemo, useState } from "react";
import type { UseAnniversaryImportResult } from "../../hooks/useAnniversaryImport";
import MemberSearchSelect from "../visitation/MemberSearchSelect";

interface Props {
  importState: UseAnniversaryImportResult;
  onClose: () => void;
  onImported: () => void;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function AnniversaryImportPreviewModal({ importState, onClose, onImported }: Props) {
  const { step, rows, skippedParseRows, error, summary, updateRowMatch, confirmImport, reset } = importState;
  const [search, setSearch] = useState("");

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.raw.toLowerCase().includes(q));
  }, [rows, search]);

  const matchedCount = rows.filter((r) => r.husbandMemberId || r.wifeMemberId).length;

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal calendar-import-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Import Wedding Anniversaries</h2>

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

        {step === "preview" && (
          <>
            <p>
              Found <strong>{rows.length}</strong> anniversary row{rows.length !== 1 ? "s" : ""} in this file.{" "}
              <strong>{matchedCount}</strong> matched to at least one existing member.
              {skippedParseRows.length > 0 && (
                <> <strong>{skippedParseRows.length}</strong> row{skippedParseRows.length !== 1 ? "s" : ""} couldn't be read.</>
              )}
            </p>
            <p className="import-preview-more">
              We've guessed the husband/wife for each couple — please confirm or correct each one below. Rows left
              blank on both sides will be skipped.
            </p>

            <div className="input-wrap import-preview-search">
              <input
                type="text"
                placeholder="Search to spot-check a couple…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>From File</th>
                    <th>Date</th>
                    <th>Husband</th>
                    <th>Wife</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((r) => (
                    <tr key={r.rowNumber}>
                      <td>{r.rowNumber}</td>
                      <td>{r.raw}</td>
                      <td>{formatDisplayDate(r.date)}</td>
                      <td style={{ minWidth: 220 }}>
                        <MemberSearchSelect
                          value={r.husbandMemberId}
                          displayName={r.husbandName || "— not matched —"}
                          onSelect={(m) => updateRowMatch(r.rowNumber, "husband", m)}
                        />
                      </td>
                      <td style={{ minWidth: 220 }}>
                        <MemberSearchSelect
                          value={r.wifeMemberId}
                          displayName={r.wifeName || "— not matched —"}
                          onSelect={(m) => updateRowMatch(r.rowNumber, "wife", m)}
                        />
                      </td>
                    </tr>
                  ))}
                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)" }}>
                        No matches for "{search}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {skippedParseRows.length > 0 && (
              <details className="import-skipped-details">
                <summary>{skippedParseRows.length} unreadable row{skippedParseRows.length !== 1 ? "s" : ""} (click to view)</summary>
                <ul>
                  {skippedParseRows.slice(0, 20).map((s) => (
                    <li key={s.rowNumber}>Row {s.rowNumber}: {s.reason}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose}>Skip This</button>
              <button className="btn-primary" onClick={confirmImport} disabled={matchedCount === 0}>
                <i className="fa-solid fa-file-import" aria-hidden="true" />
                Import {matchedCount} Anniversar{matchedCount !== 1 ? "ies" : "y"}
              </button>
            </div>
          </>
        )}

        {step === "importing" && <p>Saving anniversaries…</p>}

        {step === "done" && (
          <>
            <div className="import-success">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <p>Anniversaries imported!</p>
              {summary && (
                <ul className="import-summary-list">
                  <li>{summary.written} member record{summary.written !== 1 ? "s" : ""} updated</li>
                  {summary.skippedRows > 0 && (
                    <li>{summary.skippedRows} row{summary.skippedRows !== 1 ? "s" : ""} skipped (no match)</li>
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