import { useState } from "react";

interface LookupListEditorProps {
  label: string;
  values: string[];
  saving: boolean;
  onAdd: (value: string) => void;
  onRemove: (value: string) => void;
  onRename: (oldValue: string, newValue: string) => void;
}

export default function LookupListEditor({
  label,
  values,
  saving,
  onAdd,
  onRemove,
  onRename,
}: LookupListEditorProps) {
  const [newValue, setNewValue] = useState("");
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  function handleAdd() {
    if (!newValue.trim()) return;
    onAdd(newValue);
    setNewValue("");
  }

  function startEdit(v: string) {
    setEditingValue(v);
    setEditingText(v);
  }

  function commitEdit() {
    if (editingValue !== null && editingText.trim() && editingText.trim() !== editingValue) {
      onRename(editingValue, editingText);
    }
    setEditingValue(null);
  }

  return (
    <div className="lookup-list-editor">
      <h3 className="lookup-list-title">
        {label}
        {saving && <span className="lookup-list-saving"> · Saving…</span>}
      </h3>

      <div className="lookup-list-add-row">
        <input
          type="text"
          placeholder={`Add new ${label.toLowerCase()}…`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button type="button" className="btn-secondary" onClick={handleAdd}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add
        </button>
      </div>

      <ul className="lookup-list-items">
        {values.length === 0 ? (
          <li className="lookup-list-empty">No items yet.</li>
        ) : (
          values.map((v) => (
            <li key={v} className="lookup-list-item">
              {editingValue === v ? (
                <input
                  type="text"
                  className="lookup-list-edit-input"
                  value={editingText}
                  autoFocus
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingValue(null);
                  }}
                  onBlur={commitEdit}
                />
              ) : (
                <span>{v}</span>
              )}
              <div className="lookup-list-item-actions">
                <button type="button" className="btn-icon" title="Rename" onClick={() => startEdit(v)}>
                  <i className="fa-regular fa-pen-to-square" />
                </button>
                <button
                  type="button"
                  className="btn-icon danger"
                  title="Delete"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete "${v}"? Members already using this value will keep it until edited.`
                      )
                    ) {
                      onRemove(v);
                    }
                  }}
                >
                  <i className="fa-regular fa-trash-can" />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
