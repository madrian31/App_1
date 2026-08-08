import type { UseMemberImportResult } from "../../hooks/useMemberImport";

interface ImportPreviewModalProps {
  importState: UseMemberImportResult;
  currentUser: string;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportPreviewModal({ importState, currentUser, onClose, onImported }: ImportPreviewModalProps) {
  const { step, parseResult, error, progress, confirmImport, reset } = importState;

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

            <div className="import-preview-table-wrap">
              <table className="import-preview-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.slice(0, 10).map((r) => (
                    <tr key={r.rowNumber}>
                      <td>{r.rowNumber}</td>
                      <td>{r.data.firstName} {r.data.middleInitial} {r.data.lastName}</td>
                      <td>{r.data.category || "—"}</td>
                      <td>{r.data.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parseResult.rows.length > 10 && (
                <p className="import-preview-more">…and {parseResult.rows.length - 10} more.</p>
              )}
            </div>

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
