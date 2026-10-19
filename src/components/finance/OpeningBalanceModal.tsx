import { useState } from "react";

interface OpeningBalanceModalProps {
  openingBalance: number;
  openingDate: string;
  saving: boolean;
  onSave: (amount: number, date: string) => void;
  onClose: () => void;
}

export default function OpeningBalanceModal({
  openingBalance,
  openingDate,
  saving,
  onSave,
  onClose,
}: OpeningBalanceModalProps) {
  const [amount, setAmount] = useState(openingBalance ? String(openingBalance) : "");
  const [date, setDate] = useState(openingDate);

  const parsed = parseFloat(amount);
  const canSave = amount === "" || (!isNaN(parsed) && parsed >= 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Set General Fund Balance</h2>
        <p className="finance-modal-help">
          The money the church already had before tithes were recorded in the app. Tithes dated on or after the
          "as of" date are added to it.
        </p>

        <div className="ledger-form-grid">
          <div className="ledger-field">
            <label>Opening Balance (₱)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="ledger-field">
            <label>As of</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={saving || !canSave}
            onClick={() => onSave(parseFloat(amount) || 0, date)}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
