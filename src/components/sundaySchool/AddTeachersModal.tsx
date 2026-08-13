import { useEffect, useMemo, useState } from "react";
import type { Member } from "../../types/member";
import Pagination from "../members/Pagination";

interface AddTeachersModalProps {
  members: Member[]; // all members, unfiltered — modal filters out archived internally
  onToggleTeacher: (id: string) => void;
  onToggleAssistant: (id: string) => void;
  onClose: () => void;
}

type ChecklistView = "all" | "teachers" | "assistants";

const PAGE_SIZE = 10;

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

function fullName(m: Member): string {
  return `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ""} ${m.lastName}`;
}

export default function AddTeachersModal({
  members,
  onToggleTeacher,
  onToggleAssistant,
  onClose,
}: AddTeachersModalProps) {
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

  // Close on Escape, same courtesy as the click-outside behavior on the search pickers.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const eligible = useMemo(() => members.filter((m) => !m.isArchived), [members]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eligible.filter((m) => {
      if (view === "teachers" && !m.isSundaySchoolTeacher) return false;
      if (view === "assistants" && !m.isSundaySchoolAssistantTeacher) return false;
      if (q && !fullName(m).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [eligible, search, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const teacherCount = useMemo(() => eligible.filter((m) => m.isSundaySchoolTeacher).length, [eligible]);
  const assistantCount = useMemo(
    () => eligible.filter((m) => m.isSundaySchoolAssistantTeacher).length,
    [eligible]
  );

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-label="Add Teachers">
        <div className="modal-header">
          <h2>Add Teachers</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="modal-body">
          <p className="pledger-checklist-hint">
            Check a member as Teacher and/or Assistant Teacher. Changes save immediately — no separate save button needed.
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
              className={`view-chip${view === "teachers" ? " active" : ""}`}
              onClick={() => handleViewChange("teachers")}
            >
              Teachers
            </button>
            <button
              type="button"
              className={`view-chip${view === "assistants" ? " active" : ""}`}
              onClick={() => handleViewChange("assistants")}
            >
              Assistants
            </button>
          </div>

          <div className="pledger-checklist">
            {visible.length === 0 ? (
              <p className="pledger-checklist-empty">No matching members.</p>
            ) : (
              visible.map((m) => (
                <div className="teacher-checklist-row" key={m.id}>
                  <div className="avatar avatar-sm">{initials(m)}</div>
                  <span className="teacher-checklist-name">{fullName(m)}</span>
                  <label className="teacher-role-check">
                    <input
                      type="checkbox"
                      checked={m.isSundaySchoolTeacher}
                      onChange={() => onToggleTeacher(m.id)}
                    />
                    Teacher
                  </label>
                  <label className="teacher-role-check">
                    <input
                      type="checkbox"
                      checked={m.isSundaySchoolAssistantTeacher}
                      onChange={() => onToggleAssistant(m.id)}
                    />
                    Assistant
                  </label>
                </div>
              ))
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
              {teacherCount} teacher{teacherCount !== 1 ? "s" : ""} · {assistantCount} assistant
              {assistantCount !== 1 ? "s" : ""}
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