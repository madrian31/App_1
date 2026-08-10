import type { Member } from "../../types/member";

interface ArchivedMembersTableProps {
  members: Member[];
  loading: boolean;
  onUnarchive: (id: string) => void;
}

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

const COL_COUNT = 4; // Member, Category, Date Archived, Actions

export default function ArchivedMembersTable({ members, loading, onUnarchive }: ArchivedMembersTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Category</th>
            <th className="col-hide-mobile">Date Added</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <p>Loading archived members…</p>
                </div>
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-box" />
                  <p>No archived members.</p>
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
                  {m.category ? (
                    <span className="badge badge-category">{m.category}</span>
                  ) : (
                    <span className="date-text">—</span>
                  )}
                </td>
                <td className="col-hide-mobile">
                  <span className="date-text">{m.dateAdded}</span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-icon" title="Restore to Members" onClick={() => onUnarchive(m.id)}>
                      <i className="fa-solid fa-box-open" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
