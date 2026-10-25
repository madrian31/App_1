import type { Member } from "../../types/member";
import { PW_SKILLS } from "../../types/praiseWorship";

interface PraiseWorshipMembersTableProps {
  members: Member[];
  loading: boolean;
  search: string;
  onEditPositions: (id: string) => void;
  onRemove: (id: string) => void;
  // Opens Add Members with the same search, for when the person isn't on the team yet.
  onSearchAllMembers: () => void;
  canEdit: boolean; // view-only accounts see the team without the edit/remove/add actions
}

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

export default function PraiseWorshipMembersTable({
  members,
  loading,
  search,
  onEditPositions,
  onRemove,
  onSearchAllMembers,
  canEdit,
}: PraiseWorshipMembersTableProps) {
  const query = search.trim();
  const colCount = canEdit ? 3 : 2; // Member, Positions, (actions)

  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Positions</th>
            {canEdit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <p>Loading members…</p>
                </div>
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-solid fa-music" />
                  {query ? (
                    <>
                      <p>No one on the team matches "{query}".</p>
                      {canEdit && (
                        <>
                          <p>This list only shows team members. If the person isn't on the team yet, add them first.</p>
                          <button type="button" className="btn-secondary pw-empty-action" onClick={onSearchAllMembers}>
                            <i className="fa-solid fa-user-plus" aria-hidden="true" />
                            Search "{query}" in all members
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <p>No team members found.</p>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            members.map((m) => {
              const name = `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ""} ${m.lastName}`;
              // Listed in the standard order, whatever order they were saved in.
              const skills = PW_SKILLS.filter((s) => m.praiseWorshipSkills?.includes(s.key));
              return (
                <tr key={m.id}>
                  <td>
                    <div className="member-cell">
                      <div className="avatar">{initials(m)}</div>
                      <span className="member-name">{name}</span>
                    </div>
                  </td>
                  <td>
                    {skills.length > 0 ? (
                      <div className="pw-skill-list">
                        {skills.map((s) => (
                          <span key={s.key} className="badge badge-category">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    ) : canEdit ? (
                      <button type="button" className="pw-link-btn" onClick={() => onEditPositions(m.id)}>
                        No positions yet — set positions
                      </button>
                    ) : (
                      <span className="date-text">No positions yet</span>
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      <div className="actions-cell">
                        <button className="btn-icon" title="Edit positions" onClick={() => onEditPositions(m.id)}>
                          <i className="fa-regular fa-pen-to-square" />
                        </button>
                        <button className="btn-icon danger" title="Remove from the team" onClick={() => onRemove(m.id)}>
                          <i className="fa-solid fa-user-minus" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
