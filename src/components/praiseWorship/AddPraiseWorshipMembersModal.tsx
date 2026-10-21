import { useEffect, useMemo, useState } from "react";
import { isPraiseWorshipTeamMember } from "../../types/member";
import type { Member } from "../../types/member";
import Pagination from "../members/Pagination";

interface AddPraiseWorshipMembersModalProps {
  members: Member[]; // every active member
  onSetOnTeam: (id: string, onTeam: boolean) => void;
  onClose: () => void;
}

type ChecklistView = "all" | "team";

const PAGE_SIZE = 10;

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

function fullName(m: Member): string {
  return `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ""} ${m.lastName}`;
}

export default function AddPraiseWorshipMembersModal({
  members,
  onSetOnTeam,
  onClose,
}: AddPraiseWorshipMembersModalProps) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ChecklistView>("all");
  const [currentPage, setCurrentPage] = useState(1);

  function handleSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleViewChange(value: ChecklistView) {
    setView(value);
    setCurrentPage(1);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => {
        if (view === "team" && !isPraiseWorshipTeamMember(m)) return false;
        if (q && !fullName(m).toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [members, search, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const teamCount = useMemo(() => members.filter(isPraiseWorshipTeamMember).length, [members]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add Team Members">
        <div className="modal-header">
          <h2>Add Team Members</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <p className="pledger-checklist-hint">
            Check a member to add them to the Praise &amp; Worship team. Changes save right away.
          </p>

          <div className="search-wrap">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search members…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              autoFocus
            />
          </div>

          <div className="checklist-view-toggle">
            <button
              type="button"
              className={`view-chip${view === "all" ? " active" : ""}`}
              onClick={() => handleViewChange("all")}
            >
              All Members
            </button>
            <button
              type="button"
              className={`view-chip${view === "team" ? " active" : ""}`}
              onClick={() => handleViewChange("team")}
            >
              On the Team
            </button>
          </div>

          <div className="pledger-checklist">
            {visible.length === 0 ? (
              <p className="pledger-checklist-empty">No matching members.</p>
            ) : (
              visible.map((m) => {
                const onTeam = isPraiseWorshipTeamMember(m);
                return (
                  <div className="teacher-checklist-row" key={m.id}>
                    <div className="avatar avatar-sm">{initials(m)}</div>
                    <span className="teacher-checklist-name">{fullName(m)}</span>
                    <label className="teacher-role-check">
                      <input type="checkbox" checked={onTeam} onChange={() => onSetOnTeam(m.id, !onTeam)} />
                      On the team
                    </label>
                  </div>
                );
              })
            )}
          </div>

          <Pagination
            pageSize={PAGE_SIZE}
            onPageSizeChange={() => {}}
            currentPage={safePage}
            totalPages={totalPages}
            start={start}
            filteredCount={filtered.length}
            onFirst={() => setCurrentPage(1)}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            onLast={() => setCurrentPage(totalPages)}
          />

          <div className="pledger-checklist-footer">
            <span className="pledger-checklist-count">
              {teamCount} on the team
            </span>
            <button type="button" className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
