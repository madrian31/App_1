import { useNavigate } from "react-router-dom";
import { initials } from "../../hooks/useMembers";
import type { Member } from "../../types/member";

interface MembersTableProps {
  members: Member[];
  loading: boolean;
  onArchive: (id: string) => void;
}

export default function MembersTable({ members, loading, onArchive }: MembersTableProps) {
  const navigate = useNavigate();

  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Added By</th>
            <th>Date Added</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="empty-cell">
                <div className="empty-state">
                  <p>Loading members…</p>
                </div>
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty-cell">
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
                      {m.middleName ? ` ${m.middleName}` : ""} {m.lastName}
                    </span>
                    <button
                      className="btn-view-profile"
                      title="View Profile"
                      onClick={() => navigate(`/Profile/${m.id}`)}
                    >
                      <i className="fa-regular fa-address-card" />
                    </button>
                  </div>
                </td>
                <td>
                  <span className="added-by">
                    <i className="fa-regular fa-user" style={{ fontSize: 12 }} />
                    {m.addedBy}
                  </span>
                </td>
                <td>
                  <span className="date-text">{m.dateAdded}</span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-icon" title="Edit" onClick={() => navigate(`/Profile/${m.id}`)}>
                      <i className="fa-regular fa-pen-to-square" />
                    </button>
                    <button className="btn-icon danger" title="Archive" onClick={() => onArchive(m.id)}>
                      <i className="fa-solid fa-box-archive" />
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
