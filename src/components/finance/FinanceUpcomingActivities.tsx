import { useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import {
  UPCOMING_WINDOWS,
  type FinanceUpcoming,
  type UpcomingActivityRow,
  type UpcomingWindow,
} from "../../hooks/useFinanceReport";
import { useCanEdit, useCurrentUserName } from "../../auth/authContext";
import { categoryBorder, categorySoftBg } from "../../types/calendarEvent";
import type { NewDepartmentFund } from "../../types/departmentFund";
import { activityDateLabel } from "../../utils/departmentActivities";
import FinanceActivityModal from "./FinanceActivityModal";
import FinanceGiveBudgetModal from "./FinanceGiveBudgetModal";
import { fmtPeso, whenLabel } from "./financeFormat";

interface FinanceUpcomingActivitiesProps {
  upcoming: FinanceUpcoming;
  fundBalance: number; // the General Fund today
  loading: boolean;
  lookAhead: UpcomingWindow;
  onLookAheadChange: (lookAhead: UpcomingWindow) => void;
  onGiveBudget: (fund: NewDepartmentFund) => Promise<void>;
}

/** Whether the budget was given yet, and — for Admins — the button to give it. */
function BudgetStatus({
  row,
  canEdit,
  onGive,
}: {
  row: UpcomingActivityRow;
  canEdit: boolean;
  onGive: (row: UpcomingActivityRow) => void;
}) {
  const departmentFundsLink = `/Finance/DepartmentFunds?activity=${encodeURIComponent(row.key)}`;
  // The row opens the activity's details; these buttons and links shouldn't.
  const stop = (e: MouseEvent) => e.stopPropagation();

  if (row.status === "noBudget") {
    return (
      <>
        <span className="date-text">No budget yet</span>
        {canEdit && (
          <Link to={departmentFundsLink} className="upcoming-action-link" onClick={stop}>
            Set budget →
          </Link>
        )}
      </>
    );
  }
  if (row.status === "fullyGiven") {
    return (
      <>
        <span className="upcoming-given">
          <i className="fa-solid fa-circle-check" aria-hidden="true" /> Given
        </span>
        <span className="dept-fund-sub">{fmtPeso(row.given)} taken from the fund</span>
      </>
    );
  }
  return (
    <>
      <span className="upcoming-needed">{fmtPeso(row.stillNeeded)}</span>
      <span className="dept-fund-sub">
        {row.status === "partlyGiven"
          ? `${fmtPeso(row.given)} of ${fmtPeso(row.budget ?? 0)} given`
          : "Not given yet"}
      </span>
      {canEdit &&
        (row.departmentId ? (
          <button
            type="button"
            className="btn-secondary upcoming-give"
            onClick={(e) => {
              stop(e);
              onGive(row);
            }}
          >
            <i className="fa-solid fa-hand-holding-dollar" aria-hidden="true" />
            {row.status === "partlyGiven" ? "Give the rest" : "Give"}
          </button>
        ) : (
          <Link to={departmentFundsLink} className="upcoming-action-link" onClick={stop}>
            Pick a department first →
          </Link>
        ))}
    </>
  );
}

/** Department activities that haven't ended yet and the budget still to be prepared for them.
 *  Nothing here is taken from the fund until its budget is given. */
export default function FinanceUpcomingActivities({
  upcoming,
  fundBalance,
  loading,
  lookAhead,
  onLookAheadChange,
  onGiveBudget,
}: FinanceUpcomingActivitiesProps) {
  const { months, count, noBudgetCount, untilLabel } = upcoming;
  const canEdit = useCanEdit(); // Users only view the list
  const currentUser = useCurrentUserName();
  const [selected, setSelected] = useState<UpcomingActivityRow | null>(null);
  const [giving, setGiving] = useState<UpcomingActivityRow | null>(null);

  return (
    <>
      <div className="upcoming-title-row">
        <div>
          <h2 className="report-section-title">Coming Up — Department Activities</h2>
          <p className="upcoming-intro">From today until {untilLabel}. Each activity stays here until it is over.</p>
        </div>
        <div className="finance-period-modes upcoming-window" role="group" aria-label="How far ahead to look">
          {UPCOMING_WINDOWS.map((w) => (
            <button
              key={w.value}
              type="button"
              className={lookAhead === w.value ? "is-active" : undefined}
              aria-pressed={lookAhead === w.value}
              onClick={() => onLookAheadChange(w.value)}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* The "how much to prepare" sentence lives on the summary card above this list. */}
      <div className="members-card">
        <div className="table-scroll">
          <table className="members-table finance-table upcoming-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Activity</th>
                <th className="finance-num">Budget</th>
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
              ) : count === 0 ? (
                <tr>
                  <td colSpan={3} className="empty-cell">
                    <div className="empty-state">
                      <i className="fa-regular fa-calendar" />
                      <p>No department activities in the Calendar from today until {untilLabel}.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                months.map((m) => [
                  <tr key={m.key} className="upcoming-month-row">
                    <th colSpan={2} scope="rowgroup">
                      {m.label}
                    </th>
                    <td className="finance-num">{m.stillNeeded > 0 ? fmtPeso(m.stillNeeded) : "—"}</td>
                  </tr>,
                  ...m.rows.map((r) => (
                    <tr key={r.key} className="finance-row-click" onClick={() => setSelected(r)}>
                      <td>
                        <span className="upcoming-date">{activityDateLabel(r.dateFrom, r.dateTo)}</span>
                        <span className="dept-fund-sub">{whenLabel(r.daysAway)}</span>
                      </td>
                      <td>
                        {/* A real button so the details can also be opened with the keyboard. */}
                        <button type="button" className="upcoming-activity" onClick={() => setSelected(r)}>
                          {r.title}
                        </button>
                        <span className="upcoming-meta">
                          <span
                            className="upcoming-category"
                            style={{
                              color: r.category.color,
                              background: categorySoftBg(r.category.color),
                              borderColor: categoryBorder(r.category.color),
                            }}
                          >
                            {r.category.label}
                          </span>
                          {r.departmentName || "No department yet"}
                        </span>
                      </td>
                      <td className="finance-num upcoming-budget">
                        <BudgetStatus row={r} canEdit={canEdit} onGive={setGiving} />
                      </td>
                    </tr>
                  )),
                ])
              )}
            </tbody>
          </table>
        </div>

        <p className="finance-table-note">
          Click an activity to see its details. {noBudgetCount > 0 && "Activities with no budget yet are not counted. "}
          {canEdit ? (
            <>
              Click <strong>Give</strong> when the money is handed to the department — only then is it taken from the
              General Fund. Budgets are set, and receipts recorded, on the{" "}
              <Link to="/Finance/DepartmentFunds">Department Funds</Link> page.
            </>
          ) : (
            "A budget is taken from the General Fund only once it is given to the department."
          )}
        </p>
      </div>

      {selected && <FinanceActivityModal activity={selected} onClose={() => setSelected(null)} />}
      {giving && (
        <FinanceGiveBudgetModal
          activity={giving}
          fundBalance={fundBalance}
          currentUser={currentUser}
          onGive={onGiveBudget}
          onClose={() => setGiving(null)}
        />
      )}
    </>
  );
}
