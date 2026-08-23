import type { UseDateRepairResult } from "../../hooks/useDateRepair";

interface Props {
  repairState: UseDateRepairResult;
  onClose: () => void;
  onRepaired: () => void;
}

export default function DateRepairModal({ repairState, onClose, onRepaired }: Props) {
  const { step, rows, ambiguous, unmatched, error, updatedCount, confirmApply, reset } = repairState;

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal calendar-import-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Fix Timezone-Shifted Dates</h2>

        {step === "scanning" && <p>Comparing file against existing members…</p>}

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
            {rows.length === 0 ? (
              <p>No differences found — every matched member's birthday and baptism date already match the file. Nothing to fix.</p>
            ) : (
              <>
                <p>
                  Found <strong>{rows.length}</strong> date{rows.length !== 1 ? "s" : ""} that will be corrected. This
                  updates the existing member records in place — no new records, no broken links to Pledges/Visits/etc.
                </p>
                <div className="import-preview-table-wrap">
                  <table className="import-preview-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Field</th>
                        <th>Old Value</th>
                        <th>Corrected Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={`${r.memberId}-${r.field}-${i}`}>
                          <td>{r.name}</td>
                          <td>{r.field === "birthday" ? "Birthday" : "Date of Baptism"}</td>
                          <td>{r.oldValue}</td>
                          <td>{r.newValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {ambiguous.length > 0 && (
              <div className="modal-error" style={{ background: "#fff8e6", color: "#7a5a00", borderColor: "#f0dca0" }}>
                <i className="fa-solid fa-circle-info" aria-hidden="true" />
                {ambiguous.length} name{ambiguous.length !== 1 ? "s" : ""} matched more than one existing member and
                were skipped (needs manual review): {ambiguous.join(", ")}
              </div>
            )}
            {unmatched.length > 0 && (
              <details className="import-skipped-details">
                <summary>{unmatched.length} row{unmatched.length !== 1 ? "s" : ""} in the file had no matching existing member</summary>
                <ul>{unmatched.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </details>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={handleClose}>Cancel</button>
              <button className="btn-primary" onClick={confirmApply} disabled={rows.length === 0}>
                <i className="fa-solid fa-wrench" aria-hidden="true" />
                Fix {rows.length} Date{rows.length !== 1 ? "s" : ""}
              </button>
            </div>
          </>
        )}

        {step === "applying" && <p>Updating member records…</p>}

        {step === "done" && (
          <>
            <div className="import-success">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <p>Fixed {updatedCount} member{updatedCount !== 1 ? "s" : ""}!</p>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => { onRepaired(); handleClose(); }}>Done</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}