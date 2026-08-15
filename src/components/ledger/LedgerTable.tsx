import type { LedgerEntry, LedgerEntryType } from "../../types/ledger";

const TYPE_CONFIG: Record<LedgerEntryType, { label: string; sign: string; className: string }> = {
  EXPENSE: { label: "Expense", sign: "−", className: "ledger-type-pill--expense" },
  LOAN_OUT: { label: "Loan Out", sign: "−", className: "ledger-type-pill--loan" },
  REPAYMENT: { label: "Repayment", sign: "+", className: "ledger-type-pill--repayment" },
};

function fmt(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

interface LedgerTableProps {
  entries: LedgerEntry[];
  loading: boolean;
  canManage: boolean;
  netOutflow: number;
  monthLabel: string; // e.g. "August 2026", shown in the footer
  deleteConfirmId: string | null;
  onEdit: (entry: LedgerEntry) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

export default function LedgerTable({
  entries,
  loading,
  canManage,
  netOutflow,
  monthLabel,
  deleteConfirmId,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: LedgerTableProps) {
  const colCount = canManage ? 6 : 5;

  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th className="col-hide-mobile">Category</th>
            <th>Description</th>
            <th className="col-hide-mobile">Modified By</th>
            <th style={{ textAlign: "right" }}>Amount</th>
            {canManage && <th></th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <p>Loading entries…</p>
                </div>
              </td>
            </tr>
          ) : entries.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-folder-open" />
                  <p>No entries for {monthLabel}.</p>
                </div>
              </td>
            </tr>
          ) : (
            entries.map((e) => {
              const cfg = TYPE_CONFIG[e.type];
              return (
                <tr key={e.id}>
                  <td>
                    <span className="date-text">{formatDisplayDate(e.dateAdded)}</span>
                  </td>
                  <td>
                    <span className={`badge ledger-type-pill ${cfg.className}`}>
                      {cfg.sign} {cfg.label}
                    </span>
                  </td>
                  <td className="col-hide-mobile">
                    {e.category ? (
                      <span className="badge badge-category">{e.category}</span>
                    ) : (
                      <span className="date-text">—</span>
                    )}
                  </td>
                  <td>{e.description}</td>
                  <td className="col-hide-mobile">
                    <span className="added-by">
                      <i className="fa-regular fa-user" style={{ fontSize: 12 }} />
                      {e.modifiedBy || "—"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    {cfg.sign} {fmt(e.amount)}
                  </td>
                  {canManage && (
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" title="Edit" onClick={() => onEdit(e)}>
                          <i className="fa-regular fa-pen-to-square" />
                        </button>
                        {deleteConfirmId === e.id ? (
                          <span className="ledger-delete-confirm">
                            <button className="btn-secondary" onClick={() => onConfirmDelete(e.id)}>
                              Delete
                            </button>
                            <button className="btn-secondary" onClick={onCancelDelete}>
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button className="btn-icon danger" title="Delete" onClick={() => onRequestDelete(e.id)}>
                            <i className="fa-regular fa-trash-can" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
        {entries.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={canManage ? 5 : 4} style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                Net Outflow — {monthLabel}
              </td>
              <td
                style={{
                  textAlign: "right",
                  fontWeight: 700,
                  color: netOutflow > 0 ? "var(--danger)" : "var(--success)",
                }}
              >
                {fmt(netOutflow)}
              </td>
              {canManage && <td></td>}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
