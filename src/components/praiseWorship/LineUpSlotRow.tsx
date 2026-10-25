import type { RoleAssignment } from "../../types/programLineUp";
import { skillLabel } from "../../types/praiseWorship";
import type { PwSlot } from "../../types/praiseWorship";
import type { SlotOptions } from "../../hooks/usePraiseWorshipLineUp";

interface LineUpSlotRowProps {
  slot: PwSlot;
  people: RoleAssignment[]; // who's assigned now
  options: SlotOptions;
  disabled?: boolean;
  readOnly?: boolean; // view-only accounts: names only, nothing to pick
  onChange: (people: RoleAssignment[]) => void;
}

export default function LineUpSlotRow({ slot, people, options, disabled, readOnly, onChange }: LineUpSlotRowProps) {
  const { qualified, others } = options;

  // View-only accounts just see who's assigned.
  if (readOnly) {
    return (
      <div className="lineup-row">
        <div className="role-label">{slot.label}</div>
        <div className="pw-slot-control">
          {people.length > 0 ? (
            <div className="pw-chip-list">
              {people.map((p) => (
                <span key={p.id} className="pw-chip">
                  {p.name}
                </span>
              ))}
            </div>
          ) : (
            <span className="date-text">Not assigned</span>
          )}
        </div>
      </div>
    );
  }

  const hint = qualified.length > 0 ? `${qualified.length} member${qualified.length !== 1 ? "s" : ""}` : "No members yet";

  function find(id: string): RoleAssignment | undefined {
    return [...qualified, ...others, ...people].find((p) => p.id === id);
  }

  // A saved person who's no longer on the team still needs an <option>,
  // or the select would silently show someone else.
  const known = new Set([...qualified, ...others].map((p) => p.id));
  const strays = people.filter((p) => !known.has(p.id));

  // Backup Singers: everyone already picked is left out of "Add".
  const picked = new Set(people.map((p) => p.id));
  const listFor = (list: RoleAssignment[]) => (slot.multiple ? list.filter((p) => !picked.has(p.id)) : list);

  const groups = (
    <>
      {!slot.multiple &&
        strays.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} (not on the team)
          </option>
        ))}
      {listFor(qualified).length > 0 && (
        <optgroup label={skillLabel(slot.skill)}>
          {listFor(qualified).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      )}
      {listFor(others).length > 0 && (
        <optgroup label="Other team members">
          {listFor(others).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );

  return (
    <div className="lineup-row">
      <div className="role-label">
        {slot.label}
        <small>{hint}</small>
      </div>

      <div className="pw-slot-control">
        {slot.multiple ? (
          <>
            {people.length > 0 && (
              <div className="pw-chip-list">
                {people.map((p) => (
                  <span key={p.id} className="pw-chip">
                    {p.name}
                    <button
                      type="button"
                      aria-label={`Remove ${p.name}`}
                      title={`Remove ${p.name}`}
                      disabled={disabled}
                      onClick={() => onChange(people.filter((x) => x.id !== p.id))}
                    >
                      <i className="fa-solid fa-xmark" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <select
              className="pw-select"
              value=""
              disabled={disabled}
              aria-label={`Add to ${slot.label}`}
              onChange={(e) => {
                const pick = find(e.target.value);
                if (pick) onChange([...people, pick]);
              }}
            >
              <option value="">+ Add {skillLabel(slot.skill).toLowerCase()}…</option>
              {groups}
            </select>
          </>
        ) : (
          <select
            className="pw-select"
            value={people[0]?.id ?? ""}
            disabled={disabled}
            aria-label={slot.label}
            onChange={(e) => {
              const pick = find(e.target.value);
              onChange(pick ? [pick] : []);
            }}
          >
            <option value="">— Not assigned —</option>
            {groups}
          </select>
        )}
      </div>
    </div>
  );
}
