import { LIQUIDATION_LABELS, liquidationStatus, unliquidatedAmount, type DepartmentFund } from "../../types/departmentFund";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "../finance/financeFormat";

interface DepartmentFundsTableProps {
  entries: DepartmentFund[];
  loading: boolean;
  year: number;
  departmentName: (id: string) => string;
  deleteConfirmId: string | null;
  onEdit: (entry: DepartmentFund) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

const STATUS_PILL = {
  pending: "ledger-type-pill--loan",
  partial: "ledger-type-pill--loan",
  done: "ledger-type-pill--repayment",
} as const;

export default function DepartmentFundsTable({
  entries,
  loading,
  year,
  departmentName,
  deleteConfirmId,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: DepartmentFundsTableProps) {
  const colCount = 8;
  const total = (key: "amountGiven" | "amountSpent" | "amountReturned") => entries.reduce((s, e) => s + e[key], 0);

  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Date Given</th>
            <th>Department</th>
            <th>Event / Purpose</th>
            <th style={{ textAlign: "right" }}>Amount Given</th>
            <th className="col-hide-mobile" style={{ textAlign: "right" }}>
              Spent
            </th>
            <th className="col-hide-mobile" style={{ textAlign: "right" }}>
              Returned
            </th>
            <th>Liquidation</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <p>Loading…</p>
                </div>
              </td>
            </tr>
          ) : entries.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-folder-open" />
                  <p>No budget given to departments for {year}.</p>
                </div>
              </td>
            </tr>
          ) : (
            entries.map((e) => {
              const status = liquidationStatus(e);
              const left = unliquidatedAmount(e);
              return (
                <tr key={e.id}>
                  <td>
                    <span className="date-text">{formatDisplayDate(e.dateGiven)}</span>
                  </td>
                  <td>
                    <span className="badge badge-category">{departmentName(e.departmentId)}</span>
                  </td>
                  <td>
                    {e.purpose}
                    {e.receivedBy && <span className="dept-fund-sub">Received by {e.receivedBy}</span>}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtPeso(e.amountGiven)}</td>
                  <td className="col-hide-mobile" style={{ textAlign: "right" }}>
                    {e.amountSpent > 0 ? fmtPeso(e.amountSpent) : <span className="date-text">—</span>}
                  </td>
                  <td className="col-hide-mobile" style={{ textAlign: "right" }}>
                    {e.amountReturned > 0 ? fmtPeso(e.amountReturned) : <span className="date-text">—</span>}
                  </td>
                  <td>
                    <span className={`badge ledger-type-pill ${STATUS_PILL[status]}`}>{LIQUIDATION_LABELS[status]}</span>
                    {left > 0 && <span className="dept-fund-sub">{fmtPeso(left)} to account for</span>}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        title={status === "done" ? "Edit" : "Edit or record liquidation"}
                        onClick={() => onEdit(e)}
                      >
                        <i className={status === "done" ? "fa-regular fa-pen-to-square" : "fa-solid fa-receipt"} />
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
                </tr>
              );
            })
          )}
        </tbody>
        {!loading && entries.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={3} style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                Total — {year}
              </td>
              <td style={{ textAlign: "right", fontWeight: 700 }}>{fmtPeso(total("amountGiven"))}</td>
              <td className="col-hide-mobile" style={{ textAlign: "right", fontWeight: 700 }}>
                {fmtPeso(total("amountSpent"))}
              </td>
              <td className="col-hide-mobile" style={{ textAlign: "right", fontWeight: 700 }}>
                {fmtPeso(total("amountReturned"))}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
