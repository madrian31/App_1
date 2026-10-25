import { useEffect } from "react";
import { OTHER_ACTIVITY, type DepartmentFundForm } from "../../hooks/useDepartmentFunds";
import type { Department } from "../../types/department";
import type { DepartmentActivity } from "../../utils/departmentActivities";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "../finance/financeFormat";

interface ActivityInfo {
  title: string;
  dateFrom: string;
  dateTo: string;
  budget: number | null;
  givenSoFar: number | null;
  left: number | null;
  noDepartmentYet: boolean;
}

interface DepartmentFundFormModalProps {
  form: DepartmentFundForm;
  departments: Department[];
  year: number;
  /** The chosen department's calendar activities, and those with no department yet. */
  activities: { own: DepartmentActivity[]; unassigned: DepartmentActivity[] };
  activityInfo: ActivityInfo | null; // the chosen activity's budget picture
  onChooseActivity: (choice: string) => void;
  isEditing: boolean;
  saving: boolean;
  canSave: boolean;
  problem: string | null;
  budgetWarning: string | null;
  unliquidated: number; // budget still to be accounted for, from what's typed so far
  error: string | null;
  onChange: <K extends keyof DepartmentFundForm>(key: K, value: DepartmentFundForm[K]) => void;
  onSave: () => void;
  onClose: () => void;
}

/** Give a department its budget from the General Fund, and — after the activity — record the
 *  receipts and any unused budget returned. */
export default function DepartmentFundFormModal({
  form,
  departments,
  year,
  activities,
  activityInfo,
  onChooseActivity,
  isEditing,
  saving,
  canSave,
  problem,
  budgetWarning,
  unliquidated,
  error,
  onChange,
  onSave,
  onClose,
}: DepartmentFundFormModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const given = parseFloat(form.amountGiven) || 0;
  const returned = parseFloat(form.amountReturned) || 0;
  const title = isEditing ? "Edit Budget Given" : "Add Budget";
  const departmentName = departments.find((d) => d.id === form.departmentId)?.name ?? "this department";
  const noActivities = activities.own.length === 0 && activities.unassigned.length === 0;
  const activityOption = (a: DepartmentActivity) => (
    <option key={a.key} value={a.key}>
      {formatDisplayDate(a.dateFrom)} — {a.title}
    </option>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box dept-fund-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal-title">{title}</h2>

        <h3 className="dept-fund-section">Budget given from the General Fund</h3>
        <div className="ledger-form-grid dept-fund-grid">
          <div className="ledger-field">
            <label htmlFor="df-department">Department</label>
            <select
              id="df-department"
              value={form.departmentId}
              onChange={(e) => onChange("departmentId", e.target.value)}
            >
              <option value="">Select department…</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </div>

          <div className="ledger-field">
            <label htmlFor="df-activity">Activity</label>
            <select
              id="df-activity"
              value={form.notInCalendar ? OTHER_ACTIVITY : form.eventId}
              disabled={!form.departmentId}
              onChange={(e) => onChooseActivity(e.target.value)}
            >
              <option value="">{form.departmentId ? "Select an activity…" : "Select a department first"}</option>
              {activities.own.length > 0 && (
                <optgroup label={`${departmentName} — ${year}`}>{activities.own.map(activityOption)}</optgroup>
              )}
              {activities.unassigned.length > 0 && (
                <optgroup label="No department yet">{activities.unassigned.map(activityOption)}</optgroup>
              )}
              {form.departmentId && <option value={OTHER_ACTIVITY}>Other — not in the Calendar</option>}
            </select>
            {form.departmentId && noActivities && !form.notInCalendar && (
              <small className="dept-fund-hint">
                No {year} activities in the Calendar for {departmentName}. Choose "Other" if it isn't one.
              </small>
            )}
          </div>

          {activityInfo && (
            <div className="ledger-field--full dept-fund-activity">
              <div className="dept-fund-activity-title">
                <i className="fa-regular fa-calendar" aria-hidden="true" /> {activityInfo.title}
                <span>
                  {activityInfo.dateFrom === activityInfo.dateTo
                    ? formatDisplayDate(activityInfo.dateFrom)
                    : `${formatDisplayDate(activityInfo.dateFrom)} – ${formatDisplayDate(activityInfo.dateTo)}`}
                </span>
              </div>
              {activityInfo.budget === null ? (
                <p className="dept-fund-activity-none">No allocated budget set for this activity yet.</p>
              ) : (
                <dl className="dept-fund-activity-figures">
                  <div>
                    <dt>Allocated Budget</dt>
                    <dd>{fmtPeso(activityInfo.budget)}</dd>
                  </div>
                  <div>
                    <dt>Given So Far</dt>
                    <dd>{fmtPeso(activityInfo.givenSoFar ?? 0)}</dd>
                  </div>
                  <div>
                    <dt>Budget Left</dt>
                    <dd className={(activityInfo.left ?? 0) < 0 ? "finance-down" : undefined}>
                      {(activityInfo.left ?? 0) < 0 ? "−" : ""}
                      {fmtPeso(Math.abs(activityInfo.left ?? 0))}
                    </dd>
                  </div>
                </dl>
              )}
              {activityInfo.noDepartmentYet && (
                <p className="dept-fund-activity-none">This activity will be added to {departmentName}.</p>
              )}
            </div>
          )}

          {form.notInCalendar && (
            <div className="ledger-field ledger-field--full">
              <label htmlFor="df-purpose">What is it for?</label>
              <input
                id="df-purpose"
                type="text"
                placeholder="e.g. New instruments for the Music Ministry"
                value={form.purpose}
                onChange={(e) => onChange("purpose", e.target.value)}
              />
            </div>
          )}

          <div className="ledger-field">
            <label htmlFor="df-amount-given">Amount Given (₱)</label>
            <input
              id="df-amount-given"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.amountGiven}
              onChange={(e) => onChange("amountGiven", e.target.value)}
            />
          </div>

          <div className="ledger-field">
            <label htmlFor="df-date-given">Date Given</label>
            <input
              id="df-date-given"
              type="date"
              value={form.dateGiven}
              onChange={(e) => onChange("dateGiven", e.target.value)}
            />
          </div>

          <div className="ledger-field ledger-field--full">
            <label htmlFor="df-received-by">Received By</label>
            <input
              id="df-received-by"
              type="text"
              placeholder="Who received the money for the department"
              value={form.receivedBy}
              onChange={(e) => onChange("receivedBy", e.target.value)}
            />
          </div>
        </div>

        {budgetWarning && (
          <p className="dept-fund-warning">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {budgetWarning}
          </p>
        )}

        <h3 className="dept-fund-section">
          Liquidation <span className="dept-fund-section-hint">— fill in after the activity</span>
        </h3>
        <div className="ledger-form-grid dept-fund-grid">
          <div className="ledger-field">
            <label htmlFor="df-amount-spent">Amount Spent (₱)</label>
            <input
              id="df-amount-spent"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.amountSpent}
              onChange={(e) => onChange("amountSpent", e.target.value)}
            />
            <small className="dept-fund-hint">Total of the receipts handed in</small>
          </div>

          <div className="ledger-field">
            <label htmlFor="df-amount-returned">Unused Budget Returned (₱)</label>
            <input
              id="df-amount-returned"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.amountReturned}
              onChange={(e) => onChange("amountReturned", e.target.value)}
            />
            <small className="dept-fund-hint">Goes back to the General Fund</small>
          </div>

          {returned > 0 && (
            <div className="ledger-field">
              <label htmlFor="df-date-returned">Date Returned</label>
              <input
                id="df-date-returned"
                type="date"
                value={form.dateReturned}
                onChange={(e) => onChange("dateReturned", e.target.value)}
              />
            </div>
          )}

          <div className="ledger-field ledger-field--full">
            <label htmlFor="df-notes">Notes</label>
            <input
              id="df-notes"
              type="text"
              placeholder="Optional — e.g. receipts kept in the finance folder"
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
            />
          </div>
        </div>

        {given > 0 && !problem && (
          <p className={`dept-fund-balance${unliquidated > 0 ? "" : " is-done"}`}>
            {unliquidated > 0 ? (
              <>
                Still to be accounted for: <strong>{fmtPeso(unliquidated)}</strong>
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check" aria-hidden="true" /> Fully liquidated
              </>
            )}
          </p>
        )}

        {(problem || error) && (
          <div className="modal-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {problem || error}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving || !canSave}>
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Budget"}
          </button>
        </div>
      </div>
    </div>
  );
}
