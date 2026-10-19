import type { FinanceMonthRow } from "../../hooks/useFinanceReport";
import { fmtPeso } from "./financeFormat";

interface FinanceMonthlyTableProps {
  months: FinanceMonthRow[];
  loading: boolean;
  selectedKey: string | null; // month currently shown on its own, if any
  onSelectMonth: (year: number, month: number) => void;
}

export default function FinanceMonthlyTable({
  months,
  loading,
  selectedKey,
  onSelectMonth,
}: FinanceMonthlyTableProps) {
  const totalTithes = months.reduce((s, m) => s + m.tithes, 0);
  const totalOfferings = months.reduce((s, m) => s + m.offerings, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);

  return (
    <div className="members-card">
      <div className="table-scroll">
        <table className="members-table finance-table">
          <thead>
            <tr>
              <th>Month</th>
              <th className="finance-num">Tithes</th>
              <th className="finance-num">Offerings</th>
              <th className="finance-num">Expenses</th>
              <th className="finance-num">Net</th>
              <th className="finance-num">Fund Balance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <p>Loading…</p>
                  </div>
                </td>
              </tr>
            ) : (
              months.map((m) => (
                <tr
                  key={m.key}
                  className={`finance-row-click${m.key === selectedKey ? " finance-row-selected" : ""}`}
                  onClick={() => onSelectMonth(m.year, m.month)}
                >
                  <td>{m.label}</td>
                  <td className="finance-num">{fmtPeso(m.tithes)}</td>
                  <td className="finance-num">{fmtPeso(m.offerings)}</td>
                  <td className="finance-num">{fmtPeso(m.expenses)}</td>
                  <td className={`finance-num ${m.net < 0 ? "finance-down" : ""}`}>
                    {m.net < 0 ? "−" : ""}
                    {fmtPeso(Math.abs(m.net))}
                    {m.net < 0 && (
                      <i
                        className="fa-solid fa-triangle-exclamation"
                        title="Expenses were more than tithes and offerings"
                        aria-label="Deficit"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </td>
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
                  {fmtPeso(totalTithes)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700, color: "var(--success)" }}>
                  {fmtPeso(totalOfferings)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(totalExpenses)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(totalTithes + totalOfferings - totalExpenses)}
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
