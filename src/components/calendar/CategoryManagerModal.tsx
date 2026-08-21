import { useState } from "react";
import type { CalendarCategoryItem } from "../../types/calendarEvent";

interface Props {
  categories: CalendarCategoryItem[];
  saving: boolean;
  onAdd: (label: string, icon: string, color: string) => void;
  onUpdate: (id: string, data: Partial<Omit<CalendarCategoryItem, "id">>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const DEFAULT_NEW_COLOR = "#534AB7";
const DEFAULT_NEW_ICON = "fa-solid fa-tag";

export default function CategoryManagerModal({ categories, saving, onAdd, onUpdate, onRemove, onClose }: Props) {
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState(DEFAULT_NEW_ICON);
  const [newColor, setNewColor] = useState(DEFAULT_NEW_COLOR);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startEdit(cat: CalendarCategoryItem) {
    setEditingId(cat.id);
    setEditLabel(cat.label);
    setEditIcon(cat.icon);
  }

  function saveEdit(id: string) {
    if (!editLabel.trim()) return;
    onUpdate(id, { label: editLabel.trim(), icon: editIcon.trim() || DEFAULT_NEW_ICON });
    setEditingId(null);
  }

  function handleAdd() {
    if (!newLabel.trim()) return;
    onAdd(newLabel.trim(), newIcon.trim() || DEFAULT_NEW_ICON, newColor);
    setNewLabel("");
    setNewIcon(DEFAULT_NEW_ICON);
    setNewColor(DEFAULT_NEW_COLOR);
  }

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    onRemove(id);
    setConfirmDeleteId(null);
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal category-manager-modal">
        <div className="day-modal-header">
          <h2>Manage Categories</h2>
          <button type="button" className="day-modal-close" aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="category-manager-body">
          <div className="category-manager-add-row">
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} title="Color" />
            <input
              type="text"
              placeholder="fa-solid fa-tag"
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              title="Font Awesome class"
            />
            <input
              type="text"
              placeholder="Category name"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <button type="button" className="btn-primary" onClick={handleAdd} disabled={saving || !newLabel.trim()}>
              <i className="fa-solid fa-plus" aria-hidden="true" />
            </button>
          </div>
          <p className="category-manager-hint">Icon uses a Font Awesome class, e.g. "fa-solid fa-star".</p>

          <div className="category-manager-list">
            {categories.length === 0 && <p className="cat-empty-hint">No categories yet — add one above.</p>}
            {categories.map((cat) => (
              <div key={cat.id} className="category-manager-row">
                <input
                  type="color"
                  value={cat.color}
                  onChange={(e) => onUpdate(cat.id, { color: e.target.value })}
                  title="Color"
                />
                {editingId === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="cat-edit-icon"
                    />
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                      autoFocus
                      className="cat-edit-label"
                    />
                    <div className="category-manager-row-actions">
                      <button type="button" className="btn-icon" onClick={() => saveEdit(cat.id)} title="Save">
                        <i className="fa-solid fa-check" aria-hidden="true" />
                      </button>
                      <button type="button" className="btn-icon" onClick={() => setEditingId(null)} title="Cancel">
                        <i className="fa-solid fa-xmark" aria-hidden="true" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <i className={cat.icon} style={{ color: cat.color, width: 16 }} aria-hidden="true" />
                    <span className="category-manager-label">{cat.label}</span>
                    <div className="category-manager-row-actions">
                      <button type="button" className="btn-icon" onClick={() => startEdit(cat)} title="Edit">
                        <i className="fa-regular fa-pen-to-square" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className={`btn-icon${confirmDeleteId === cat.id ? " danger-confirm" : ""}`}
                        onClick={() => handleDeleteClick(cat.id)}
                        title={confirmDeleteId === cat.id ? "Click again to confirm" : "Delete"}
                      >
                        <i className="fa-regular fa-trash-can" aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
