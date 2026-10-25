import { Link } from "react-router-dom";
import type { FinanceDepartmentRow } from "../../hooks/useFinanceReport";
import { fmtPeso } from "./financeFormat";

interface FinanceDepartmentTableProps {
  rows: FinanceDepartmentRow[];
  loading: boolean;
  periodLabel: string;
}

/** Budget each department was given from the General Fund in the period, and the unused budget it returned. */
export default function FinanceDepartmentTable({ rows, loading, periodLabel }: FinanceDepartmentTableProps) {
  const given = rows.reduce((s, r) => s + r.given, 0);
  const returned = rows.reduce((s, r) => s + r.returned, 0);
  const net = given - returned;

  return (
    <div className="members-card">
      <div className="table-scroll">
        <table className="members-table finance-table">
          <thead>
            <tr>
              <th>Department</th>
              <th className="finance-num">Given</th>
              <th className="finance-num">Returned</th>
              <th className="finance-num">From the Fund</th>
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-cell">
                  <div className="empty-state">
                    <i className="fa-regular fa-folder-open" />
                    <p>No budget given to or returned by departments for {periodLabel}.</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.departmentId}>
                  <td>{r.name}</td>
                  <td className="finance-num">{fmtPeso(r.given)}</td>
                  <td className="finance-num">{r.returned > 0 ? fmtPeso(r.returned) : <span className="date-text">—</span>}</td>
                  <td className="finance-num" style={{ fontWeight: 600 }}>
                    {r.net < 0 ? "−" : ""}
                    {fmtPeso(Math.abs(r.net))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>Total — {periodLabel}</td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(given)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700, color: "var(--success)" }}>
                  {fmtPeso(returned)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700, color: "var(--danger)" }}>
                  {net < 0 ? "−" : ""}
                  {fmtPeso(Math.abs(net))}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="finance-table-note">
        Allocated budgets, receipts and unliquidated amounts are on the{" "}
        <Link to="/Finance/DepartmentFunds">Department Funds</Link> page.
      </p>
    </div>
  );
}
