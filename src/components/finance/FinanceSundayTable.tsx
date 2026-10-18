import type { FinanceSundayRow } from "../../hooks/useFinanceReport";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "./financeFormat";

interface FinanceSundayTableProps {
  sundays: FinanceSundayRow[];
  loading: boolean;
  monthLabel: string;
  monthTotal: number;
}

/** Per-service totals — for checking the recorded amount against the cash counted that day. */
export default function FinanceSundayTable({ sundays, loading, monthLabel, monthTotal }: FinanceSundayTableProps) {
  return (
    <div className="members-card">
      <div className="table-scroll">
        <table className="members-table finance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="finance-num">Givers</th>
              <th className="finance-num">Total Tithes</th>
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
            ) : sundays.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  <div className="empty-state">
                    <i className="fa-regular fa-folder-open" />
                    <p>No tithes recorded for {monthLabel}.</p>
                  </div>
                </td>
              </tr>
            ) : (
              sundays.map((s) => (
                <tr key={s.date}>
                  <td>
                    <span className="date-text">{formatDisplayDate(s.date)}</span>
                  </td>
                  <td className="finance-num">{s.givers}</td>
                  <td className="finance-num" style={{ fontWeight: 600 }}>
                    {fmtPeso(s.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && sundays.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={2} style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                  Total — {monthLabel}
                </td>
                <td className="finance-num" style={{ fontWeight: 700, color: "var(--success)" }}>
                  {fmtPeso(monthTotal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
