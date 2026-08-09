import { useEffect, useMemo, useRef, useState } from "react";
import { getAllMembers } from "../../services/members/memberService/membersService";
import type { Member } from "../../types/member";

interface ParticipantPickerProps {
  participants: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}

/** Search-and-select participants from existing members, with a free-text fallback
 *  for people who aren't in the members list (e.g. guests, visiting leaders). */
export default function ParticipantPicker({ participants, onAdd, onRemove }: ParticipantPickerProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAllMembers()
      .then((all) => setMembers(all.filter((m) => !m.isArchived)))
      .catch((err) => console.error("Failed to load members:", err));
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .map((m) => `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ""} ${m.lastName}`)
      .filter((name) => !participants.includes(name))
      .filter((name) => (q ? name.toLowerCase().includes(q) : true))
      .slice(0, 20);
  }, [members, participants, query]);

  function commitCustomName() {
    const trimmed = query.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setQuery("");
    setOpen(false);
  }

  function handlePick(name: string) {
    onAdd(name);
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitCustomName();
    }
  }

  return (
    <div className="member-search-select" ref={wrapRef}>
      <div className="participant-input-wrap">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search a member or type a name and press Enter…"
            value={query}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button type="button" className="btn-secondary" onClick={commitCustomName}>
          Add
        </button>
      </div>

      {open && (
        <div className="member-search-dropdown">
          {results.length === 0 ? (
            <p className="member-search-empty">
              {query.trim()
                ? `No matching members — press Enter or "Add" to add "${query.trim()}".`
                : "No members found."}
            </p>
          ) : (
            results.map((name) => (
              <button type="button" key={name} className="member-search-option" onClick={() => handlePick(name)}>
                {name}
              </button>
            ))
          )}
        </div>
      )}

      {participants.length > 0 && (
        <div className="participant-chips">
          {participants.map((p) => (
            <span className="participant-chip" key={p}>
              {p}
              <button type="button" onClick={() => onRemove(p)} aria-label={`Remove ${p}`}>
                <i className="fa-solid fa-xmark" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
