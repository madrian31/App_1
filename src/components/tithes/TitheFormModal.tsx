import type { TitheForm } from "../../hooks/useTithes";
import MemberSearchSelect from "../visitation/MemberSearchSelect";

interface TitheFormModalProps {
  form: TitheForm;
  isEditing: boolean;
  saving: boolean;
  canSave: boolean;
  error: string | null;
  onChange: <K extends keyof TitheForm>(key: K, value: TitheForm[K]) => void;
  onAnonymousChange: (isAnonymous: boolean) => void;
  onSelectMember: (memberId: string, memberName: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function TitheFormModal({
  form,
  isEditing,
  saving,
  canSave,
  error,
  onChange,
  onAnonymousChange,
  onSelectMember,
  onSave,
  onClose,
}: TitheFormModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{isEditing ? "Edit Tithe" : "New Tithe"}</h2>

        <div className="ledger-form-grid">
          <div className="ledger-field ledger-field--full">
            <label>Giver</label>
            <div className="ledger-type-group">
              <button
                type="button"
                className={`ledger-type-btn ledger-type-btn--repayment${!form.isAnonymous ? " active" : ""}`}
                onClick={() => onAnonymousChange(false)}
              >
                <i className="fa-regular fa-user" aria-hidden="true" /> Member
              </button>
              <button
                type="button"
                className={`ledger-type-btn ledger-type-btn--loan${form.isAnonymous ? " active" : ""}`}
                onClick={() => onAnonymousChange(true)}
              >
                <i className="fa-solid fa-user-secret" aria-hidden="true" /> Non-member / Anonymous
              </button>
            </div>
          </div>

          <div className="ledger-field ledger-field--full">
            <label>{form.isAnonymous ? "Name (optional)" : "Member"}</label>
            {form.isAnonymous ? (
              <input
                type="text"
                placeholder="Leave blank for Anonymous"
                value={form.memberName}
                onChange={(e) => onChange("memberName", e.target.value)}
              />
            ) : (
              <MemberSearchSelect
                value={form.memberId}
                displayName={form.memberName}
                onSelect={(m) => onSelectMember(m.id, `${m.firstName} ${m.lastName}`)}
              />
            )}
          </div>

          <div className="ledger-field">
            <label>Date</label>
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
            <label>Notes</label>
            <input
              type="text"
              placeholder="e.g. Envelope #, GCash…"
              value={form.notes}
              onChange={(e) => onChange("notes", e.target.value)}
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
            {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Tithe"}
          </button>
        </div>
      </div>
    </div>
  );
}
