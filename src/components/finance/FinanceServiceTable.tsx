import type { FinanceServiceRow } from "../../hooks/useFinanceReport";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "./financeFormat";

interface FinanceServiceTableProps {
  services: FinanceServiceRow[];
  loading: boolean;
  periodLabel: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** What came in at each service — for checking the recorded amounts against the cash counted that day. */
export default function FinanceServiceTable({ services, loading, periodLabel }: FinanceServiceTableProps) {
  const totals = services.reduce(
    (s, r) => ({ tithes: s.tithes + r.tithes, offerings: s.offerings + r.offerings, total: s.total + r.total }),
    { tithes: 0, offerings: 0, total: 0 }
  );
  const money = (n: number) => (n > 0 ? fmtPeso(n) : "—");

  return (
    <div className="members-card">
      <div className="table-scroll">
        <table className="members-table finance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th className="finance-num">Tithes</th>
              <th className="finance-num">Offering</th>
              <th className="finance-num">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  <div className="empty-state">
                    <p>Loading…</p>
                  </div>
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  <div className="empty-state">
                    <i className="fa-regular fa-folder-open" />
                    <p>No tithes or offerings recorded for {periodLabel}.</p>
                  </div>
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.date}>
                  <td>
                    <span className="date-text">
                      {DAY_NAMES[new Date(`${s.date}T00:00:00`).getDay()]}, {formatDisplayDate(s.date)}
                    </span>
                    {s.givers > 0 && (
                      <span className="finance-givers">
                        {s.givers} {s.givers === 1 ? "giver" : "givers"}
                      </span>
                    )}
                  </td>
                  <td className="finance-num">{money(s.tithes)}</td>
                  <td className="finance-num">{money(s.offerings)}</td>
                  <td className="finance-num" style={{ fontWeight: 600 }}>
                    {fmtPeso(s.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && services.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>Total</td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(totals.tithes)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(totals.offerings)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700, color: "var(--success)" }}>
                  {fmtPeso(totals.total)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
