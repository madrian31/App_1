import { useState } from "react";
import { CATEGORY_KEYS, CATEGORIES, type CalendarCategory } from "../../types/calendarEvent";
import type { EventFormState } from "../../hooks/useCalendar";

interface Props {
  form: EventFormState;
  isEditing: boolean;
  onChange: <K extends keyof EventFormState>(key: K, value: EventFormState[K]) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function EventFormModal({ form, isEditing, onChange, onSave, onDelete, onClose }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
              <select id="f-cat" value={form.cat} onChange={(e) => onChange("cat", e.target.value as CalendarCategory)}>
                {CATEGORY_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORIES[key].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          <div className="modal-actions">
            {isEditing && (
              <button
                type="button"
                className={`btn-danger${confirmingDelete ? " confirming" : ""}`}
                style={{ marginRight: "auto" }}
                onClick={handleDeleteClick}
              >
                {confirmingDelete ? "Confirm delete?" : "Delete"}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
