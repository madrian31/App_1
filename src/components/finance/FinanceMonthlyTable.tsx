import type { FinanceMonthRow } from "../../hooks/useFinanceReport";
import { fmtPeso } from "./financeFormat";

interface FinanceMonthlyTableProps {
  months: FinanceMonthRow[];
  loading: boolean;
  yearTithes: number;
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
}

export default function FinanceMonthlyTable({
  months,
  loading,
  yearTithes,
  selectedMonth,
  onSelectMonth,
}: FinanceMonthlyTableProps) {
  const yearExpenses = months.reduce((s, m) => s + m.expenses, 0);

  return (
    <div className="members-card">
      <div className="table-scroll">
        <table className="members-table finance-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="finance-num">Tithes</th>
              <th className="finance-num">Expenses</th>
              <th className="finance-num">Net</th>
              <th className="finance-num">Fund Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="empty-cell">
                  <div className="empty-state">
                    <p>Loading…</p>
                  </div>
                </td>
              </tr>
            ) : (
              months.map((m) => (
                <tr
                  key={m.month}
                  className={`finance-row-click${m.month === selectedMonth ? " finance-row-selected" : ""}`}
                  onClick={() => onSelectMonth(m.month)}
                >
                  <td>{m.label}</td>
                  <td className="finance-num">{fmtPeso(m.tithes)}</td>
                  <td className="finance-num">{fmtPeso(m.expenses)}</td>
                  <td className={`finance-num ${m.net < 0 ? "finance-down" : ""}`}>{fmtPeso(m.net)}</td>
                  <td className="finance-num" style={{ fontWeight: 600 }}>
                    {m.balance === null ? <span className="date-text">—</span> : fmtPeso(m.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>Total</td>
                <td className="finance-num" style={{ fontWeight: 700, color: "var(--success)" }}>
                  {fmtPeso(yearTithes)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(yearExpenses)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(yearTithes - yearExpenses)}
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
