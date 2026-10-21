import type { Member } from "../../types/member";
import { PW_SKILLS } from "../../types/praiseWorship";

interface PraiseWorshipMembersTableProps {
  members: Member[];
  loading: boolean;
  onEditPositions: (id: string) => void;
  onRemove: (id: string) => void;
}

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

const COL_COUNT = 3; // Member, Positions, actions

export default function PraiseWorshipMembersTable({
  members,
  loading,
  onEditPositions,
  onRemove,
}: PraiseWorshipMembersTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Positions</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <p>Loading members…</p>
                </div>
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-solid fa-music" />
                  <p>No team members found.</p>
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
                    ) : (
                      <button type="button" className="pw-link-btn" onClick={() => onEditPositions(m.id)}>
                        No positions yet — set positions
                      </button>
                    )}
                  </td>
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
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
