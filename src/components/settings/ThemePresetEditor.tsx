import { useState } from "react";
import type { ThemePreset } from "../../types/themePreset";

interface ThemePresetEditorProps {
  presets: ThemePreset[];
  saving: boolean;
  onAdd: (title: string, verse: string) => void;
  onEdit: (id: string, title: string, verse: string) => void;
  onRemove: (id: string) => void;
}

export default function ThemePresetEditor({ presets, saving, onAdd, onEdit, onRemove }: ThemePresetEditorProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newVerse, setNewVerse] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVerse, setEditVerse] = useState("");

  function handleAdd() {
    if (!newTitle.trim()) return;
    onAdd(newTitle, newVerse);
    setNewTitle("");
    setNewVerse("");
  }

  function startEdit(p: ThemePreset) {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditVerse(p.verse);
  }

  function commitEdit(id: string) {
    onEdit(id, editTitle, editVerse);
    setEditingId(null);
  }

  return (
    <div>
      <div className="lookup-list-title">
        Theme Presets
        {saving && <span className="lookup-list-saving"> Saving…</span>}
      </div>

      <div className="lookup-list-add-row" style={{ flexDirection: "column" }}>
        <input
          type="text"
          placeholder="Theme title, e.g. Guided by God's Wisdom"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Theme verse, e.g. Psalms 25:4-5"
          value={newVerse}
          onChange={(e) => setNewVerse(e.target.value)}
          style={{ marginTop: 6 }}
        />
        <button className="btn-add" style={{ marginTop: 6 }} onClick={handleAdd} disabled={!newTitle.trim()}>
          Add Theme
        </button>
      </div>

      {presets.length === 0 ? (
        <p className="lookup-list-empty">No theme presets yet.</p>
      ) : (
        <ul className="lookup-list-items">
          {presets.map((p) => (
            <li className="lookup-list-item" key={p.id}>
              {editingId === p.id ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <input
                    className="lookup-list-edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                  />
                  <input
                    className="lookup-list-edit-input"
                    value={editVerse}
                    onChange={(e) => setEditVerse(e.target.value)}
                  />
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.verse || "—"}</div>
                </div>
              )}
              <div className="lookup-list-item-actions">
                {editingId === p.id ? (
                  <button className="btn-icon" onClick={() => commitEdit(p.id)}>
                    <i className="fa-solid fa-check" />
                  </button>
                ) : (
                  <button className="btn-icon" onClick={() => startEdit(p)}>
                    <i className="fa-regular fa-pen-to-square" />
                  </button>
                )}
                <button className="btn-icon danger" onClick={() => onRemove(p.id)}>
                  <i className="fa-regular fa-trash-can" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}