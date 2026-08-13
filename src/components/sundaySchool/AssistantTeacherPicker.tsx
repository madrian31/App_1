import { useEffect, useMemo, useRef, useState } from "react";
import type { Member } from "../../types/member";
import type { AssistantTeacherRef } from "../../types/sundaySchoolLineUp";

interface AssistantTeacherPickerProps {
  assistants: Member[]; // pre-filtered to isSundaySchoolAssistantTeacher && !isArchived
  selected: AssistantTeacherRef[];
  onAdd: (ref: AssistantTeacherRef) => void;
  onRemove: (memberId: string) => void;
}

function fullName(m: Member): string {
  return `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ""} ${m.lastName}`;
}

export default function AssistantTeacherPicker({
  assistants,
  selected,
  onAdd,
  onRemove,
}: AssistantTeacherPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedIds = new Set(selected.map((s) => s.memberId));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assistants
      .filter((m) => !selectedIds.has(m.id))
      .filter((m) => (q ? fullName(m).toLowerCase().includes(q) : true));
  }, [assistants, query, selectedIds]);

  function handlePick(m: Member) {
    onAdd({ memberId: m.id, memberName: fullName(m) });
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="member-search-select" ref={wrapRef}>
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search assistant teachers…"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
      </div>

      {open && (
        <div className="member-search-dropdown">
          {results.length === 0 ? (
            <p className="member-search-empty">
              {assistants.length === 0
                ? "No assistant teachers set up yet — go to Manage Teachers."
                : "No matches."}
            </p>
          ) : (
            results.map((m) => (
              <button type="button" key={m.id} className="member-search-option" onClick={() => handlePick(m)}>
                {fullName(m)}
              </button>
            ))
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="participant-chips">
          {selected.map((s) => (
            <span className="participant-chip" key={s.memberId}>
              {s.memberName}
              <button type="button" onClick={() => onRemove(s.memberId)} aria-label={`Remove ${s.memberName}`}>
                <i className="fa-solid fa-xmark" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
