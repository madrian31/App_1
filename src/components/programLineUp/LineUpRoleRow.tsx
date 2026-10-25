import UpNextPopover from "./UpNextPopover";
import type { RoleAssignment } from "../../types/programLineUp";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
}

interface LineUpRoleRowProps {
  label: string;
  hint: string; // e.g. "from Council pool", "category rotation"
  current: RoleAssignment | null;
  upNext: RoleAssignment[];
  onReassign?: () => void; // omit for fixed, non-rotation rows (e.g. Tangkilik)
  readOnly?: boolean; // view-only accounts: no Reassign button
}

export default function LineUpRoleRow({ label, hint, current, upNext, onReassign, readOnly }: LineUpRoleRowProps) {
  const canReassign = Boolean(onReassign) && !readOnly;

  return (
    <div className="lineup-row">
      <div className="role-label">
        {label}
        <small>{hint}</small>
      </div>

      <div className="assignee">
        <div className="avatar">{current ? initialsOf(current.name) : "—"}</div>
        <div>
          <div className="assignee-name">{current?.name || "Not yet assigned"}</div>
          {!readOnly && <div className="assignee-hint">{current ? "Next in rotation" : "Pick from the pool"}</div>}
        </div>
      </div>

      {onReassign && <UpNextPopover upNext={upNext} />}

      <div className="row-actions">
        {canReassign ? (
          <button className="btn-icon" title={`Reassign ${label}`} onClick={onReassign}>
            <i className="fa-solid fa-shuffle" aria-hidden="true" />
          </button>
        ) : (
          <button className="btn-icon" style={{ visibility: "hidden" }} tabIndex={-1} aria-hidden="true">
            <i className="fa-solid fa-shuffle" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
