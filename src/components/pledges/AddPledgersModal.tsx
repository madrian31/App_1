import { useMemo, useState } from "react";
import type { Member } from "../../types/member";

interface AddPledgersModalProps {
  members: Member[]; // full active (non-archived) member list
  onToggle: (id: string) => void;
  onClose: () => void;
}

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

const DEFAULT_VISIBLE = 10;

export default function AddPledgersModal({ members, onToggle, onClose }: AddPledgersModalProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"all" | "selected">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (view === "selected") {
      const selected = members.filter((m) => m.isPledger);
      return q ? selected.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)) : selected;
    }

    if (q) {
      return members.filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q));
    }

    // No search yet, viewing "All" — show currently-selected pledgers first (easy to unmark),
    // then fill the rest of the default slots with other members, instead of dumping the
    // entire member list (could be hundreds) into a single scrollable box.
    const selected = members.filter((m) => m.isPledger);
    const others = members.filter((m) => !m.isPledger);
    return [...selected, ...others].slice(0, DEFAULT_VISIBLE);
  }, [members, search, view]);

  const isCapped = view === "all" && !search.trim() && members.length > DEFAULT_VISIBLE;
  const pledgerCount = members.filter((m) => m.isPledger).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Add Pledgers</h2>
        <p className="pledger-checklist-hint">Check a member to add them as a pledger. Uncheck to remove.</p>

        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="checklist-view-toggle">
          <button
            type="button"
            className={`view-chip${view === "all" ? " active" : ""}`}
            onClick={() => setView("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`view-chip${view === "selected" ? " active" : ""}`}
            onClick={() => setView("selected")}
          >
            Selected
          </button>
        </div>

        <div className="pledger-checklist">
          {filtered.length === 0 ? (
            <p className="pledger-checklist-empty">
              {view === "selected" ? "No pledgers selected yet." : "No members found."}
            </p>
          ) : (
            filtered.map((m) => (
              <label className="pledger-checklist-row" key={m.id}>
                <input type="checkbox" checked={m.isPledger} onChange={() => onToggle(m.id)} />
                <span className="avatar avatar-sm">{initials(m)}</span>
                <span className="pledger-checklist-name">
                  {m.firstName}
                  {m.middleInitial ? ` ${m.middleInitial}` : ""} {m.lastName}
                </span>
              </label>
            ))
          )}
        </div>

        {isCapped && (
          <p className="pledger-checklist-capped-hint">
            Showing {filtered.length} of {members.length} members — search by name to find someone specific.
          </p>
        )}

        <div className="modal-actions pledger-checklist-footer">
          <span className="pledger-checklist-count">
            {pledgerCount} pledger{pledgerCount !== 1 ? "s" : ""} selected
          </span>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
