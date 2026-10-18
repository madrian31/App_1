import type { ExpenseForm } from "../../hooks/useExpenses";
import { expenseCategoryIcon } from "./expenseCategoryIcon";

interface ExpenseFormModalProps {
  form: ExpenseForm;
  categories: string[];
  isEditing: boolean;
  saving: boolean;
  canSave: boolean;
  error: string | null;
  onChange: <K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ExpenseFormModal({
  form,
  categories,
  isEditing,
  saving,
  canSave,
  error,
  onChange,
  onSave,
  onClose,
}: ExpenseFormModalProps) {
  // Keep an entry's category selectable even if it was later removed from the list.
  const options = form.category && !categories.includes(form.category) ? [...categories, form.category] : categories;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{isEditing ? "Edit Expense" : "New Expense"}</h2>

        <div className="ledger-form-grid">
          <div className="ledger-field ledger-field--full">
            <label>Category</label>
            <div className="ledger-type-group">
              {options.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`ledger-type-btn ledger-type-btn--expense${form.category === c ? " active" : ""}`}
                  onClick={() => onChange("category", c)}
                >
                  <i className={expenseCategoryIcon(c)} aria-hidden="true" /> {c}
                </button>
              ))}
            </div>
          </div>

          <div className="ledger-field">
            <label>Date Paid</label>
            <input type="date" value={form.date} onChange={(e) => onChange("date", e.target.value)} />
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
            <label>Description</label>
            <input
              type="text"
              placeholder="e.g. Meralco — Sept bill"
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="modal-error">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={onSave} disabled={saving || !canSave}>
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}
