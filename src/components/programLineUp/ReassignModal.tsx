import { useMemo, useState } from "react";
import type { RoleAssignment } from "../../types/programLineUp";

interface ReassignModalProps {
  roleLabel: string; // e.g. "Presider", "Usher"
  /** Single-pick list — categories or a single-person pool. */
  options?: RoleAssignment[];
  /** When provided alongside `options`, renders a second tab that lets the
   *  user search + check off one or more specific people instead of picking
   *  a single category/person (used by Special Number). */
  memberOptions?: RoleAssignment[];
  /** Free-text input instead of any list — used for Flower Family, which
   *  has no member-based source list yet. */
  freeText?: boolean;
  onConfirm: (pick: RoleAssignment) => void;
  onClose: () => void;
}

export default function ReassignModal({
  roleLabel,
  options = [],
  memberOptions,
  freeText,
  onConfirm,
  onClose,
}: ReassignModalProps) {
  const [tab, setTab] = useState<"list" | "members">("list");
  const [search, setSearch] = useState("");
  const [textValue, setTextValue] = useState("");
  const [checked, setChecked] = useState<Record<string, string>>({}); // id -> name

  const activeOptions = tab === "members" ? memberOptions ?? [] : options;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeOptions;
    return activeOptions.filter((o) => o.name.toLowerCase().includes(q));
  }, [activeOptions, search]);

  function pick(option: RoleAssignment) {
    onConfirm(option);
    onClose();
  }

  function toggleChecked(option: RoleAssignment) {
    setChecked((prev) => {
      const next = { ...prev };
      if (next[option.id]) delete next[option.id];
      else next[option.id] = option.name;
      return next;
    });
  }

  function confirmMembers() {
    const ids = Object.keys(checked);
    if (ids.length === 0) return;
    onConfirm({ id: ids.join("|"), name: Object.values(checked).join(", ") });
    onClose();
  }

  function confirmFreeText() {
    const trimmed = textValue.trim();
    if (!trimmed) return;
    onConfirm({ id: trimmed, name: trimmed });
    onClose();
  }

  if (freeText) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <h2 className="modal-title">Reassign {roleLabel}</h2>
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
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Reassign {roleLabel}</h2>

        {memberOptions && (
          <div className="checklist-view-toggle">
            <button
              type="button"
              className={`view-chip${tab === "list" ? " active" : ""}`}
              onClick={() => {
                setTab("list");
                setSearch("");
              }}
            >
              Category
            </button>
            <button
              type="button"
              className={`view-chip${tab === "members" ? " active" : ""}`}
              onClick={() => {
                setTab("members");
                setSearch("");
              }}
            >
              Search Members
            </button>
          </div>
        )}

        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder={tab === "members" ? "Search members…" : `Search ${roleLabel.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="pledger-checklist">
          {filtered.length === 0 ? (
            <p className="pledger-checklist-empty">No matches found.</p>
          ) : tab === "members" ? (
            filtered.map((o) => (
              <label className="pledger-checklist-row" key={o.id}>
                <input type="checkbox" checked={Boolean(checked[o.id])} onChange={() => toggleChecked(o)} />
                <span className="pledger-checklist-name">{o.name}</span>
              </label>
            ))
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
          {tab === "members" && (
            <button className="btn-primary" onClick={confirmMembers} disabled={Object.keys(checked).length === 0}>
              Assign {Object.keys(checked).length > 0 ? `(${Object.keys(checked).length})` : ""}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}