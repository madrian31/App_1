import { Link } from "react-router-dom";
import type { ActivityRow } from "../../hooks/useDepartmentFunds";
import type { Department } from "../../types/department";
import { LIQUIDATION_LABELS } from "../../types/departmentFund";
import type { DepartmentActivity } from "../../utils/departmentActivities";
import { formatDisplayDate } from "../../utils/date";
import AutoSaveInput from "../settings/AutoSaveInput";
import { fmtPeso } from "../finance/financeFormat";

interface DepartmentActivitiesTableProps {
  rows: ActivityRow[];
  loading: boolean;
  periodLabel: string; // "2026", "October 2026", "Oct 1, 2026 – Oct 31, 2026"
  departments: Department[];
  showAll: boolean;
  onDepartmentChange: (activity: DepartmentActivity, departmentId: string) => void;
  onBudgetCommit: (activity: DepartmentActivity, value: string) => boolean;
  onAddBudget: (activity: ActivityRow) => void;
}

const STATUS_PILL = {
  pending: "ledger-type-pill--loan",
  partial: "ledger-type-pill--loan",
  done: "ledger-type-pill--repayment",
} as const;

function dateRange(from: string, to: string): string {
  return from === to ? formatDisplayDate(from) : `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
}

/** The year's calendar activities: pick each one's department and allocated budget (saved on their
 *  own), see the budget given for it so far, and add budget for it. */
export default function DepartmentActivitiesTable({
  rows,
  loading,
  periodLabel,
  departments,
  showAll,
  onDepartmentChange,
  onBudgetCommit,
  onAddBudget,
}: DepartmentActivitiesTableProps) {
  const colCount = 7;

  return (
    <div className="table-scroll">
      <table className="members-table dept-activities-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Activity</th>
            <th>Department</th>
            <th style={{ textAlign: "right" }}>Allocated Budget (₱)</th>
            <th style={{ textAlign: "right" }}>Given</th>
            <th className="col-hide-mobile">Liquidation</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <p>Loading activities…</p>
                </div>
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-calendar" />
                  <p>
                    {showAll ? (
                      <>
                        No activities in the <Link to="/Calendar">Calendar</Link> for {periodLabel}.
                      </>
                    ) : (
                      <>
                        No department activities for {periodLabel}. Tick "Show all calendar activities" to pick one.
                      </>
                    )}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((a) => {
              const current = departments.find((d) => d.id === a.departmentId);
              const options = departments.filter((d) => d.isActive || d.id === a.departmentId);
              const needsDepartment = !a.departmentId && (a.budget ?? 0) > 0;
              return (
                <tr key={a.key}>
                  <td>
                    <span className="date-text">{dateRange(a.dateFrom, a.dateTo)}</span>
                  </td>
                  <td>
                    {a.title}
                    {(a.inCharge || a.location) && (
                      <span className="dept-fund-sub">
                        {[a.inCharge && `In-charge: ${a.inCharge}`, a.location].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </td>
                  <td>
                    <select
                      className={`dept-activity-select${needsDepartment ? " needs-department" : ""}`}
                      aria-label={`Department for ${a.title}`}
                      value={a.departmentId}
                      onChange={(e) => onDepartmentChange(a, e.target.value)}
                    >
                      <option value="">— No department —</option>
                      {options.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                          {d.isActive ? "" : " (inactive)"}
                        </option>
                      ))}
                      {a.departmentId && !current && <option value={a.departmentId}>Unknown department</option>}
                    </select>
                    {a.departmentSource === "matched" && (
                      <span className="dept-fund-sub" title="Found in the IN-CHARGE column. Pick another to change it.">
                        From In-charge
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <AutoSaveInput
                      className="dept-input dept-input--amount"
                      aria-label={`Allocated budget for ${a.title}`}
                      title={a.budgetText ? `From the Calendar of Activities: ${a.budgetText}` : undefined}
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={a.budgetText || "0.00"}
                      value={a.budget === null || a.budget === 0 ? "" : String(a.budget)}
                      onCommit={(v) => onBudgetCommit(a, v)}
                    />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {a.fundCount > 0 ? (
                      <>
                        <span style={{ fontWeight: 600 }}>{fmtPeso(a.given)}</span>
                        {a.returned > 0 && <span className="dept-fund-sub">{fmtPeso(a.returned)} returned</span>}
                      </>
                    ) : (
                      <span className="date-text">—</span>
                    )}
                  </td>
                  <td className="col-hide-mobile">
                    {a.status === "none" ? (
                      <span className="date-text">No budget given yet</span>
                    ) : (
                      <>
                        <span className={`badge ledger-type-pill ${STATUS_PILL[a.status]}`}>
                          {LIQUIDATION_LABELS[a.status]}
                        </span>
                        {a.unliquidated > 0 && (
                          <span className="dept-fund-sub">{fmtPeso(a.unliquidated)} to account for</span>
                        )}
                      </>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-secondary dept-activity-add"
                      onClick={() => onAddBudget(a)}
                      title={`Add budget for ${a.title}`}
                    >
                      <i className="fa-solid fa-plus" aria-hidden="true" /> Add Budget
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
