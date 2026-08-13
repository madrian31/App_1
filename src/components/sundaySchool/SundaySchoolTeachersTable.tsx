import type { Member } from "../../types/member";

interface SundaySchoolTeachersTableProps {
  members: Member[];
  loading: boolean;
  onToggleTeacher: (id: string) => void;
  onToggleAssistant: (id: string) => void;
}

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

const COL_COUNT = 3; // Member, Teacher, Assistant Teacher

export default function SundaySchoolTeachersTable({
  members,
  loading,
  onToggleTeacher,
  onToggleAssistant,
}: SundaySchoolTeachersTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Teacher</th>
            <th>Assistant Teacher</th>
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
                  <i className="fa-regular fa-user" />
                  <p>No members found.</p>
                </div>
              </td>
            </tr>
          ) : (
            members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="member-cell">
                    <div className="avatar">{initials(m)}</div>
                    <span className="member-name">
                      {m.firstName}
                      {m.middleInitial ? ` ${m.middleInitial}` : ""} {m.lastName}
                    </span>
                  </div>
                </td>
                <td>
                  <button
                    className={`toggle-pledger${m.isSundaySchoolTeacher ? " active" : ""}`}
                    onClick={() => onToggleTeacher(m.id)}
                    title={m.isSundaySchoolTeacher ? "Remove as Teacher" : "Mark as Teacher"}
                  >
                    <i className={`fa-solid ${m.isSundaySchoolTeacher ? "fa-check" : "fa-chalkboard-user"}`} />
                    {m.isSundaySchoolTeacher ? "Teacher" : "Mark"}
                  </button>
                </td>
                <td>
                  <button
                    className={`toggle-pledger${m.isSundaySchoolAssistantTeacher ? " active" : ""}`}
                    onClick={() => onToggleAssistant(m.id)}
                    title={m.isSundaySchoolAssistantTeacher ? "Remove as Assistant Teacher" : "Mark as Assistant Teacher"}
                  >
                    <i className={`fa-solid ${m.isSundaySchoolAssistantTeacher ? "fa-check" : "fa-user-group"}`} />
                    {m.isSundaySchoolAssistantTeacher ? "Assistant" : "Mark"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
