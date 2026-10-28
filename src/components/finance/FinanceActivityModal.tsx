import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { UpcomingActivityRow } from "../../hooks/useFinanceReport";
import { categoryBorder, categorySoftBg } from "../../types/calendarEvent";
import { LIQUIDATION_LABELS, liquidationStatus } from "../../types/departmentFund";
import { activityDateLabel } from "../../utils/departmentActivities";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso, whenLabel } from "./financeFormat";

interface FinanceActivityModalProps {
  activity: UpcomingActivityRow;
  onClose: () => void;
}

/** Everything about one coming-up activity: when and where, who is in charge, and its budget. View only. */
export default function FinanceActivityModal({ activity: a, onClose }: FinanceActivityModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const details: [string, string][] = [
    ["Date", `${activityDateLabel(a.dateFrom, a.dateTo)} · ${whenLabel(a.daysAway)}`],
    ["Time", a.time],
    ["Department", a.departmentName || "No department yet"],
    ["In-charge", a.inCharge || "—"],
    ["Location", a.location || "—"],
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box activity-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="activity-modal-header">
          <div>
            <span
              className="upcoming-category"
              style={{
                color: a.category.color,
                background: categorySoftBg(a.category.color),
                borderColor: categoryBorder(a.category.color),
              }}
            >
              {a.category.label}
            </span>
            <h2 id="activity-modal-title" className="modal-title">
              {a.title}
            </h2>
          </div>
          <button type="button" className="activity-modal-close" aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <dl className="activity-modal-details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <h3 className="activity-modal-subtitle">Budget</h3>
        {a.budget === null ? (
          <p className="activity-modal-empty">
            No budget has been set for this activity yet.
            {a.budgetText && <> The Calendar of Activities says: “{a.budgetText}”.</>}
          </p>
        ) : (
          <div className="activity-modal-budget">
            <div>
              <span>Budget</span>
              <strong>{fmtPeso(a.budget)}</strong>
            </div>
            <div>
              <span>Already given</span>
              <strong>{fmtPeso(a.given)}</strong>
            </div>
            <div className={a.stillNeeded > 0 ? "is-needed" : "is-done"}>
              <span>Still needed</span>
              <strong>{a.stillNeeded > 0 ? fmtPeso(a.stillNeeded) : "Fully given"}</strong>
            </div>
          </div>
        )}

        {a.funds.length > 0 && (
          <>
            <h3 className="activity-modal-subtitle">Budget given</h3>
            <ul className="activity-modal-funds">
              {a.funds.map((f) => (
                <li key={f.id}>
                  <div>
                    <strong>{fmtPeso(f.amountGiven)}</strong> on {formatDisplayDate(f.dateGiven)}
                    {f.receivedBy && <span className="dept-fund-sub">Received by {f.receivedBy}</span>}
                    {f.amountReturned > 0 && (
                      <span className="dept-fund-sub">
                        {fmtPeso(f.amountReturned)} returned
                        {f.dateReturned && ` on ${formatDisplayDate(f.dateReturned)}`}
                      </span>
                    )}
                  </div>
                  <span className="date-text">{LIQUIDATION_LABELS[liquidationStatus(f)]}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="activity-modal-actions">
          <Link to={`/Finance/DepartmentFunds?activity=${encodeURIComponent(a.key)}`} className="btn-secondary">
            <i className="fa-solid fa-hand-holding-dollar" aria-hidden="true" /> Open in Department Funds
          </Link>
          <button type="button" className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
