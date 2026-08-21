import { useEffect, useState } from "react";
import type { CalendarCategoryItem } from "../../types/calendarEvent";
import type { EventFormState } from "../../hooks/useCalendar";

interface Props {
  form: EventFormState;
  isEditing: boolean;
  saving: boolean;
  categories: CalendarCategoryItem[];
  onChange: <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onManageCategories: () => void;
}

export default function EventFormModal({
  form,
  isEditing,
  saving,
  categories,
  onChange,
  onSave,
  onDelete,
  onClose,
  onManageCategories,
}: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // If categories were empty when the form opened (or the selected one was
  // just deleted via the manager) and a category becomes available, default
  // the picker to it instead of silently leaving cat empty.
  useEffect(() => {
    if (!form.cat && categories.length > 0) {
      onChange("cat", categories[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  function handleDeleteClick() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }
    onDelete();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isEditing ? "Edit Event" : "New Event"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="f-title">Title</label>
            <input
              id="f-title"
              type="text"
              required
              placeholder="e.g. Team Standup"
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="f-date">Date</label>
              <input id="f-date" type="date" required value={form.date} onChange={(e) => onChange("date", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="f-cat">Category</label>
              <select id="f-cat" value={form.cat} onChange={(e) => onChange("cat", e.target.value)}>
                {categories.length === 0 && <option value="">No categories yet</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button type="button" className="manage-categories-link" onClick={onManageCategories}>
                + Manage categories
              </button>
            </div>
          </div>

          <label className="allday-check">
            <input type="checkbox" checked={form.allDay} onChange={(e) => onChange("allDay", e.target.checked)} />
            <span>All day event</span>
          </label>

          {!form.allDay && (
            <div className="field-row">
              <div className="field">
                <label htmlFor="f-start">Start</label>
                <input id="f-start" type="time" required value={form.start} onChange={(e) => onChange("start", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="f-end">End</label>
                <input id="f-end" type="time" required value={form.end} onChange={(e) => onChange("end", e.target.value)} />
              </div>
            </div>
          )}

          <div className="modal-actions">
            {isEditing && (
              <button
                type="button"
                className={`btn-danger${confirmingDelete ? " confirming" : ""}`}
                style={{ marginRight: "auto" }}
                onClick={handleDeleteClick}
                disabled={saving}
              >
                {confirmingDelete ? "Confirm delete?" : "Delete"}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving || categories.length === 0}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}