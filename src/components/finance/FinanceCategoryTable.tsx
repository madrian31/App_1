import type { FinanceCategoryRow } from "../../hooks/useFinanceReport";
import { expenseCategoryIcon } from "../expenses/expenseCategoryIcon";
import { fmtPeso } from "./financeFormat";

interface FinanceCategoryTableProps {
  categories: FinanceCategoryRow[];
  loading: boolean;
  monthLabel: string;
  monthExpenses: number;
}

/** Where the month's money went — each category's total and its share of that month's tithes. */
export default function FinanceCategoryTable({ categories, loading, monthLabel, monthExpenses }: FinanceCategoryTableProps) {
  return (
    <div className="members-card">
      <div className="table-scroll">
        <table className="members-table finance-table">
          <thead>
            <tr>
              <th>Category</th>
              <th className="finance-num">Amount</th>
              <th className="finance-num">% of Income</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  <div className="empty-state">
                    <p>Loading…</p>
                  </div>
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  <div className="empty-state">
                    <i className="fa-regular fa-folder-open" />
                    <p>No expenses recorded for {monthLabel}.</p>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.category}>
                  <td>
                    <i className={expenseCategoryIcon(c.category)} aria-hidden="true" style={{ marginRight: 6 }} />
                    {c.category}
                  </td>
                  <td className="finance-num" style={{ fontWeight: 600 }}>
                    {fmtPeso(c.total)}
                  </td>
                  <td className="finance-num">{c.pctOfIncome === null ? "—" : `${c.pctOfIncome.toFixed(1)}%`}</td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && categories.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>Total — {monthLabel}</td>
                <td className="finance-num" style={{ fontWeight: 700, color: "var(--danger)" }}>
                  {fmtPeso(monthExpenses)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
