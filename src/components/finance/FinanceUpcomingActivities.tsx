import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UPCOMING_WINDOWS,
  type FinanceUpcoming,
  type UpcomingActivityRow,
  type UpcomingWindow,
} from "../../hooks/useFinanceReport";
import { categoryBorder, categorySoftBg } from "../../types/calendarEvent";
import { activityDateLabel } from "../../utils/departmentActivities";
import FinanceActivityModal from "./FinanceActivityModal";
import { fmtPeso, whenLabel } from "./financeFormat";

interface FinanceUpcomingActivitiesProps {
  upcoming: FinanceUpcoming;
  loading: boolean;
  lookAhead: UpcomingWindow;
  onLookAheadChange: (lookAhead: UpcomingWindow) => void;
}

function StillNeeded({ row }: { row: UpcomingActivityRow }) {
  if (row.status === "noBudget") return <span className="date-text">No budget yet</span>;
  if (row.status === "fullyGiven") {
    return (
      <span className="upcoming-given">
        <i className="fa-solid fa-check" aria-hidden="true" /> Given
      </span>
    );
  }
  return (
    <>
      <span className="upcoming-needed">{fmtPeso(row.stillNeeded)}</span>
      {row.status === "partlyGiven" && (
        <span className="dept-fund-sub">
          {fmtPeso(row.given)} of {fmtPeso(row.budget ?? 0)} given
        </span>
      )}
    </>
  );
}

/** Department activities that haven't ended yet and the budget still to be prepared for them.
 *  Nothing here is taken from the fund until it's given on the Department Funds page. */
export default function FinanceUpcomingActivities({
  upcoming,
  loading,
  lookAhead,
  onLookAheadChange,
}: FinanceUpcomingActivitiesProps) {
  const { months, count, noBudgetCount, untilLabel } = upcoming;
  const [selected, setSelected] = useState<UpcomingActivityRow | null>(null);

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
                <th className="finance-num">Still Needed</th>
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
                      <td className="finance-num">
                        <StillNeeded row={r} />
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
          Set budgets and give them on the <Link to="/Finance/DepartmentFunds">Department Funds</Link> page.
        </p>
      </div>

      {selected && <FinanceActivityModal activity={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
