import { useEffect, useMemo, useRef, useState } from "react";
import { getAllMembers } from "../../services/members/memberService/membersService";
import type { Member } from "../../types/member";

interface LeaderPickerProps {
  value: string; // current leader name (free text)
  onChange: (name: string) => void;
}

function fullName(m: Member): string {
  return `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ""} ${m.lastName}`;
}

/** Search-and-select the visit leader from members, with a free-text fallback
 *  for leaders not yet in the members list. */
export default function LeaderPicker({ value, onChange }: LeaderPickerProps) {
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
      .filter((m) => (q ? fullName(m).toLowerCase().includes(q) : true))
      .slice(0, 20);
  }, [members, query]);

  function handlePick(m: Member) {
    onChange(fullName(m));
    setQuery("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        onChange(trimmed);
        setQuery("");
        setOpen(false);
      }
    }
  }

  return (
    <div className="member-search-select" ref={wrapRef}>
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="e.g. Juan Dela Cruz"
          value={open ? query : value}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {open && (
        <div className="member-search-dropdown">
          {results.length === 0 ? (
            <p className="member-search-empty">
              {query.trim() ? `No matches — press Enter to use "${query.trim()}".` : "No members found."}
            </p>
          ) : (
            results.map((m) => (
              <button
                type="button"
                key={m.id}
                className={`member-search-option${fullName(m) === value ? " active" : ""}`}
                onClick={() => handlePick(m)}
              >
                {fullName(m)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}