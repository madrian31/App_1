import { useEffect, useMemo, useRef, useState } from "react";
import { getAllMembers } from "../../services/members/memberService/membersService";
import type { Member } from "../../types/member";

interface MemberSearchSelectProps {
  value: string; // selected memberId
  displayName: string; // selected member's name, shown in the input when closed
  onSelect: (member: Member) => void;
}

export default function MemberSearchSelect({ value, displayName, onSelect }: MemberSearchSelectProps) {
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
    if (!q) return members.slice(0, 20);
    return members
      .filter((m) => `${m.firstName} ${m.lastName}`.toLowerCase().includes(q))
      .slice(0, 20);
  }, [members, query]);

  function handlePick(m: Member) {
    onSelect(m);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="member-search-select" ref={wrapRef}>
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search member by name…"
          value={open ? query : displayName}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {open && (
        <div className="member-search-dropdown">
          {results.length === 0 ? (
            <p className="member-search-empty">No members found.</p>
          ) : (
            results.map((m) => (
              <button
                type="button"
                key={m.id}
                className={`member-search-option${m.id === value ? " active" : ""}`}
                onClick={() => handlePick(m)}
              >
                {m.firstName} {m.middleInitial ? `${m.middleInitial} ` : ""}
                {m.lastName}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
