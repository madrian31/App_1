import { useEffect, useState } from "react";
import type { UpcomingActivityRow } from "../../hooks/useFinanceReport";
import type { NewDepartmentFund } from "../../types/departmentFund";
import { activityDateLabel } from "../../utils/departmentActivities";
import { toLocalISODate } from "../../utils/date";
import { fmtPeso } from "./financeFormat";

interface FinanceGiveBudgetModalProps {
  activity: UpcomingActivityRow;
  fundBalance: number; // the General Fund today
  currentUser: string;
  onGive: (fund: NewDepartmentFund) => Promise<void>;
  onClose: () => void;
}

/** Give a coming activity its budget straight from the Finance Report. The amount leaves the
 *  General Fund on the date given; receipts and returns are filled in later on Department Funds. */
export default function FinanceGiveBudgetModal({
  activity: a,
  fundBalance,
  currentUser,
  onGive,
  onClose,
}: FinanceGiveBudgetModalProps) {
  const [amount, setAmount] = useState(a.stillNeeded > 0 ? String(a.stillNeeded) : "");
  const [today] = useState(() => toLocalISODate(new Date()));
  const [dateGiven, setDateGiven] = useState(today);
  const [receivedBy, setReceivedBy] = useState(a.inCharge);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const value = Math.round((parseFloat(amount) || 0) * 100) / 100;
  const canSave = value > 0 && Boolean(dateGiven) && dateGiven <= today && !saving;
  const fundAfter = fundBalance - value;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await onGive({
        departmentId: a.departmentId,
        eventId: a.key,
        purpose: a.title,
        receivedBy: receivedBy.trim(),
        amountGiven: value,
        dateGiven,
        amountSpent: 0,
        amountReturned: 0,
        dateReturned: "",
        notes: "",
        addedBy: currentUser,
      });
      onClose();
    } catch (err) {
      console.error("Failed to give department budget:", err);
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={saving ? undefined : onClose}>
      <div
        className="modal-box give-budget-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-budget-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="give-budget-title" className="modal-title">
          Give Budget
        </h2>
        <p className="give-budget-activity">
          <strong>{a.title}</strong>
          <span>
            {activityDateLabel(a.dateFrom, a.dateTo)} · {a.departmentName}
          </span>
        </p>

        {a.budget !== null && (
          <dl className="give-budget-figures">
            <div>
              <dt>Budget</dt>
              <dd>{fmtPeso(a.budget)}</dd>
            </div>
            <div>
              <dt>Already given</dt>
              <dd>{fmtPeso(a.given)}</dd>
            </div>
            <div>
              <dt>Still needed</dt>
              <dd>{fmtPeso(a.stillNeeded)}</dd>
            </div>
          </dl>
        )}

        <div className="ledger-form-grid">
          <div className="ledger-field">
            <label htmlFor="gb-amount">Amount Given (₱)</label>
            <input
              id="gb-amount"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="ledger-field">
            <label htmlFor="gb-date">Date Given</label>
            {/* Not later than today: Coming Up only counts budget already handed out. */}
            <input
              id="gb-date"
              type="date"
              max={today}
              value={dateGiven}
              onChange={(e) => setDateGiven(e.target.value)}
            />
          </div>
          <div className="ledger-field ledger-field--full">
            <label htmlFor="gb-received-by">Received By</label>
            <input
              id="gb-received-by"
              type="text"
              placeholder="Who received the money for the department"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
            />
          </div>
        </div>

        {value > 0 && (
          <p className={`give-budget-effect${fundAfter < 0 ? " is-short" : ""}`}>
            <i
              className={`fa-solid ${fundAfter < 0 ? "fa-triangle-exclamation" : "fa-circle-info"}`}
              aria-hidden="true"
            />
            {fundAfter < 0 ? (
              <span>
                The General Fund has only {fmtPeso(fundBalance)}. Giving {fmtPeso(value)} leaves it{" "}
                <strong>short by {fmtPeso(-fundAfter)}</strong>.
              </span>
            ) : (
              <span>
                {fmtPeso(value)} will be taken from the General Fund. It will have <strong>{fmtPeso(fundAfter)}</strong>{" "}
                left.
              </span>
            )}
          </p>
        )}

        {error && (
          <div className="modal-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {saving ? "Saving…" : value > 0 ? `Give ${fmtPeso(value)}` : "Give Budget"}
          </button>
        </div>
      </div>
    </div>
  );
}
