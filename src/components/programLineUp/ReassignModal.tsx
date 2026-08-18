import { useMemo, useState } from "react";
import type { RoleAssignment } from "../../types/programLineUp";

interface ReassignModalProps {
  roleLabel: string; // e.g. "Presider", "Usher"
  /** List of pickable options. Omit (or pass an empty array) together with
   *  `freeText` to fall back to a plain text input instead — used for Flower
   *  Family, which has no member-based source list yet. */
  options?: RoleAssignment[];
  freeText?: boolean;
  onConfirm: (pick: RoleAssignment) => void;
  onClose: () => void;
}

export default function ReassignModal({ roleLabel, options = [], freeText, onConfirm, onClose }: ReassignModalProps) {
  const [search, setSearch] = useState("");
  const [textValue, setTextValue] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  function pick(option: RoleAssignment) {
    onConfirm(option);
    onClose();
  }

  function confirmFreeText() {
    const trimmed = textValue.trim();
    if (!trimmed) return;
    onConfirm({ id: trimmed, name: trimmed });
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Reassign {roleLabel}</h2>

        {freeText ? (
          <>
            <div className="ledger-field">
              <label>Family Name</label>
              <input
                type="text"
                placeholder="e.g. Calimbo Family"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={confirmFreeText} disabled={!textValue.trim()}>
                Assign
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="search-wrap">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="text"
                placeholder={`Search ${roleLabel.toLowerCase()}…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="pledger-checklist">
              {filtered.length === 0 ? (
                <p className="pledger-checklist-empty">No matches found.</p>
              ) : (
                filtered.map((o) => (
                  <button type="button" className="reassign-option-row" key={o.id} onClick={() => pick(o)}>
                    <span className="pledger-checklist-name">{o.name}</span>
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                ))
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
