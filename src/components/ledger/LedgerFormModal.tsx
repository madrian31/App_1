import type { LedgerEntryForm } from "../../hooks/useLedger";
import type { LedgerEntryType } from "../../types/ledger";

const TYPE_CONFIG: Record<LedgerEntryType, { label: string; sign: string }> = {
  EXPENSE: { label: "Expense", sign: "−" },
  LOAN_OUT: { label: "Loan Out", sign: "−" },
  REPAYMENT: { label: "Repayment", sign: "+" },
};

interface LedgerFormModalProps {
  form: LedgerEntryForm;
  isEditing: boolean;
  saving: boolean;
  canSave: boolean;
  onChange: <K extends keyof LedgerEntryForm>(key: K, value: LedgerEntryForm[K]) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function LedgerFormModal({
  form,
  isEditing,
  saving,
  canSave,
  onChange,
  onSave,
  onClose,
}: LedgerFormModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{isEditing ? "Edit Entry" : "New Entry"}</h2>

        <div className="ledger-form-grid">
          <div className="ledger-field ledger-field--full">
            <label>Type</label>
            <div className="ledger-type-group">
              {(Object.keys(TYPE_CONFIG) as LedgerEntryType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`ledger-type-btn ledger-type-btn--${t.toLowerCase()}${form.type === t ? " active" : ""}`}
                  onClick={() => onChange("type", t)}
                >
                  {TYPE_CONFIG[t].sign} {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="ledger-field">
            <label>Date</label>
            <input type="date" value={form.dateAdded} onChange={(e) => onChange("dateAdded", e.target.value)} />
          </div>

          <div className="ledger-field">
            <label>Amount (₱)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => onChange("amount", e.target.value)}
            />
          </div>

          <div className="ledger-field">
            <label>Category</label>
            <input
              type="text"
              placeholder="e.g. Utilities, Loan…"
              value={form.category}
              onChange={(e) => onChange("category", e.target.value)}
            />
          </div>

          <div className="ledger-field ledger-field--full">
            <label>Description</label>
            <input
              type="text"
              placeholder="Brief description"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving || !canSave}>
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
