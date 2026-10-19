import { useState } from "react";
import { fmtPeso } from "../finance/financeFormat";
import { formatDisplayDate, normalizeToISODate } from "../../utils/date";

interface StartingBalanceEditorProps {
  loading: boolean;
  startingBalance: number;
  isSet: boolean;
  modifiedBy: string;
  dateModified: string; // ISO timestamp
  saving: boolean;
  onSave: (amount: number) => Promise<boolean>;
}

/** Settings card for the General Fund starting balance — view, then edit inline. */
export default function StartingBalanceEditor({
  loading,
  startingBalance,
  isSet,
  modifiedBy,
  dateModified,
  saving,
  onSave,
}: StartingBalanceEditorProps) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");

  const parsed = parseFloat(amount);
  const valid = amount.trim() !== "" && !isNaN(parsed) && parsed >= 0;

  function startEditing() {
    setAmount(isSet ? String(startingBalance) : "");
    setEditing(true);
  }

  async function save() {
    if (!valid) return;
    if (await onSave(parsed)) setEditing(false);
  }

  return (
    <div className="starting-balance">
      <h2 className="lookup-list-title">
        <i className="fa-solid fa-piggy-bank" aria-hidden="true" /> General Fund — Starting Balance
      </h2>
      <p className="starting-balance-help">
        The money the church already had <strong>before you started recording tithes and expenses</strong> in this
        app. All tithes are added to it and all expenses are taken from it to get the General Fund Balance.
      </p>

      {loading ? (
        <p className="starting-balance-help">Loading…</p>
      ) : editing ? (
        <div className="starting-balance-edit">
          <label htmlFor="starting-balance-input">Starting balance (₱)</label>
          <div className="lookup-list-add-row">
            <input
              id="starting-balance-input"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              autoFocus
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
            <button className="btn-primary" onClick={save} disabled={saving || !valid}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn-secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="starting-balance-view">
          <div>
            <span className="starting-balance-value">{isSet ? fmtPeso(startingBalance) : "Not set yet"}</span>
            {isSet && (
              <span className="starting-balance-meta">
                Last updated {formatDisplayDate(normalizeToISODate(dateModified))}
                {modifiedBy ? ` by ${modifiedBy}` : ""}
              </span>
            )}
          </div>
          <button className={isSet ? "btn-secondary" : "btn-primary"} onClick={startEditing}>
            <i className={`fa-solid ${isSet ? "fa-pen" : "fa-plus"}`} aria-hidden="true" />{" "}
            {isSet ? "Edit" : "Set Balance"}
          </button>
        </div>
      )}
    </div>
  );
}
