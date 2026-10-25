import { Link } from "react-router-dom";
import type { DepartmentSummaryRow } from "../../hooks/useDepartmentFunds";
import { fmtPeso } from "../finance/financeFormat";

interface DepartmentBudgetTableProps {
  rows: DepartmentSummaryRow[];
  loading: boolean;
  year: number;
  totals: { budget: number; given: number; returned: number; used: number; unliquidated: number };
  activeDepartment: string; // "" = all
  onSelectDepartment: (departmentId: string) => void;
}

/** Each department's allocated budget for the year against the budget it kept (given − returned). */
export default function DepartmentBudgetTable({
  rows,
  loading,
  year,
  totals,
  activeDepartment,
  onSelectDepartment,
}: DepartmentBudgetTableProps) {
  const remaining = totals.budget - totals.used;

  return (
    <div className="members-card">
      <div className="table-scroll">
        <table className="members-table finance-table">
          <thead>
            <tr>
              <th>Department</th>
              <th className="finance-num">Allocated Budget</th>
              <th className="finance-num">Given</th>
              <th className="finance-num col-hide-mobile">Returned</th>
              <th className="finance-num">Budget Left</th>
              <th className="finance-num col-hide-mobile">Not Yet Liquidated</th>
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  <div className="empty-state">
                    <i className="fa-regular fa-folder-open" />
                    <p>
                      No departments yet. <Link to="/Settings/Departments">Add them in Settings → Departments.</Link>
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.departmentId}
                  className={`finance-row-click${r.departmentId === activeDepartment ? " finance-row-selected" : ""}`}
                  title={r.departmentId === activeDepartment ? "Show all departments" : `Show only ${r.name}`}
                  onClick={() => onSelectDepartment(r.departmentId === activeDepartment ? "" : r.departmentId)}
                >
                  <td>
                    {r.name}
                    {!r.isActive && <span className="date-text"> (inactive)</span>}
                  </td>
                  <td className="finance-num">{r.budget > 0 ? fmtPeso(r.budget) : <span className="date-text">Not set</span>}</td>
                  <td className="finance-num">{fmtPeso(r.given)}</td>
                  <td className="finance-num col-hide-mobile">{fmtPeso(r.returned)}</td>
                  <td className={`finance-num ${r.remaining < 0 ? "finance-down" : ""}`} style={{ fontWeight: 600 }}>
                    {r.budget > 0 || r.used > 0 ? (
                      <>
                        {r.remaining < 0 ? "−" : ""}
                        {fmtPeso(Math.abs(r.remaining))}
                        {r.remaining < 0 && (
                          <i
                            className="fa-solid fa-triangle-exclamation"
                            title="More was given than the allocated budget"
                            aria-label="Over budget"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </>
                    ) : (
                      <span className="date-text">—</span>
                    )}
                  </td>
                  <td className="finance-num col-hide-mobile">
                    {r.unliquidated > 0 ? fmtPeso(r.unliquidated) : <span className="date-text">—</span>}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {!loading && rows.length > 0 && (
            <tfoot>
              <tr>
                <td style={{ fontWeight: 600, color: "var(--text-muted)" }}>Total — {year}</td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(totals.budget)}
                </td>
                <td className="finance-num" style={{ fontWeight: 700 }}>
                  {fmtPeso(totals.given)}
                </td>
                <td className="finance-num col-hide-mobile" style={{ fontWeight: 700 }}>
                  {fmtPeso(totals.returned)}
                </td>
                <td className={`finance-num ${remaining < 0 ? "finance-down" : ""}`} style={{ fontWeight: 700 }}>
                  {remaining < 0 ? "−" : ""}
                  {fmtPeso(Math.abs(remaining))}
                </td>
                <td className="finance-num col-hide-mobile" style={{ fontWeight: 700 }}>
                  {fmtPeso(totals.unliquidated)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
