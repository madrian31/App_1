import type { Expense } from "../../types/expense";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "../finance/financeFormat";
import { expenseCategoryIcon } from "./expenseCategoryIcon";

interface ExpensesTableProps {
  entries: Expense[];
  loading: boolean;
  canManage: boolean;
  total: number; // total of the rows shown (respects filters)
  monthLabel: string;
  deleteConfirmId: string | null;
  onEdit: (entry: Expense) => void;
  onRequestDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
}

export default function ExpensesTable({
  entries,
  loading,
  canManage,
  total,
  monthLabel,
  deleteConfirmId,
  onEdit,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
}: ExpensesTableProps) {
  const colCount = canManage ? 6 : 5;

  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th className="col-hide-mobile">Added By</th>
            <th style={{ textAlign: "right" }}>Amount</th>
            {canManage && <th></th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <p>Loading expenses…</p>
                </div>
              </td>
            </tr>
          ) : entries.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-folder-open" />
                  <p>No expenses recorded for {monthLabel}.</p>
                </div>
              </td>
            </tr>
          ) : (
            entries.map((e) => (
              <tr key={e.id}>
                <td>
                  <span className="date-text">{formatDisplayDate(e.date)}</span>
                </td>
                <td>
                  <span className="badge badge-category expense-cat-pill">
                    <i className={expenseCategoryIcon(e.category)} aria-hidden="true" /> {e.category}
                  </span>
                </td>
                <td>{e.description || <span className="date-text">—</span>}</td>
                <td className="col-hide-mobile">
                  <span className="added-by">
                    <i className="fa-regular fa-user" style={{ fontSize: 12 }} />
                    {e.addedBy || "—"}
                  </span>
                </td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{fmtPeso(e.amount)}</td>
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
            ))
          )}
        </tbody>
        {!loading && entries.length > 0 && (
          <tfoot>
            <tr>
              <td colSpan={4} style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                Total — {monthLabel}
              </td>
              <td style={{ textAlign: "right", fontWeight: 700, color: "var(--danger)" }}>{fmtPeso(total)}</td>
              {canManage && <td></td>}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
