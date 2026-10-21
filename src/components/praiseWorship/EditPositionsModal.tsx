import { useEffect, useState } from "react";
import { PW_SKILLS } from "../../types/praiseWorship";
import type { PraiseWorshipSkill } from "../../types/praiseWorship";

interface EditPositionsModalProps {
  memberName: string;
  skills: PraiseWorshipSkill[];
  onSave: (skills: PraiseWorshipSkill[]) => Promise<boolean>;
  onClose: () => void;
}

export default function EditPositionsModal({ memberName, skills, onSave, onClose }: EditPositionsModalProps) {
  const [selected, setSelected] = useState<PraiseWorshipSkill[]>(skills);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function toggle(skill: PraiseWorshipSkill) {
    setSelected((cur) => (cur.includes(skill) ? cur.filter((s) => s !== skill) : [...cur, skill]));
  }

  async function handleSave() {
    setSaving(true);
    // Saved in the standard order so the list reads the same everywhere.
    const ok = await onSave(PW_SKILLS.map((s) => s.key).filter((k) => selected.includes(k)));
    setSaving(false);
    if (ok) onClose();
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal pw-positions-modal" role="dialog" aria-modal="true" aria-label="Edit Positions">
        <div className="modal-header">
          <h2>Positions — {memberName}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <p className="pledger-checklist-hint">
            Check every position this member can take. They will be suggested first for these positions when you
            set a line-up.
          </p>

          <div className="pw-skill-grid">
            {PW_SKILLS.map((s) => {
              const checked = selected.includes(s.key);
              return (
                <label key={s.key} className={`pw-skill-option${checked ? " checked" : ""}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggle(s.key)} />
                  {s.label}
                </label>
              );
            })}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Positions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
