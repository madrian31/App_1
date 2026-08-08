import { useNavigate } from "react-router-dom";
import { initials } from "../../hooks/useMembers";
import type { Member } from "../../types/member";

interface MembersTableProps {
  members: Member[];
  loading: boolean;
  onArchive: (id: string) => void;
  onTogglePledger?: (id: string) => void;
  /** Show the "Pledger" toggle column. Default true; set false to hide it (e.g. on the Members page). */
  showPledgerColumn?: boolean;
}

export default function MembersTable({
  members,
  loading,
  onArchive,
  onTogglePledger,
  showPledgerColumn = true,
}: MembersTableProps) {
  const navigate = useNavigate();
  const colCount = (showPledgerColumn ? 1 : 0) + 6; // Member, Category, Small Group, Added By, Date Added, Actions

  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Member</th>
            {showPledgerColumn && <th>Pledger</th>}
            <th>Category</th>
            <th className="col-hide-mobile">Small Group</th>
            <th className="col-hide-mobile">Added By</th>
            <th className="col-hide-mobile">Date Added</th>
            <th></th>
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
                {showPledgerColumn && (
                  <td>
                    <button
                      className={`toggle-pledger${m.isPledger ? " active" : ""}`}
                      onClick={() => onTogglePledger?.(m.id)}
                      title={m.isPledger ? "Remove as pledger" : "Mark as pledger"}
                    >
                      <i className={`fa-solid ${m.isPledger ? "fa-check" : "fa-hand-holding-heart"}`} />
                      {m.isPledger ? "Pledger" : "Mark"}
                    </button>
                  </td>
                )}
                <td>
                  {m.category ? (
                    <span className="badge badge-category">{m.category}</span>
                  ) : (
                    <span className="date-text">—</span>
                  )}
                </td>
                <td className="col-hide-mobile">
                  {m.isSmallGroupLeader ? (
                    <span className="badge badge-leader">
                      <i className="fa-solid fa-people-group" /> Leader
                    </span>
                  ) : (
                    <span className="date-text">—</span>
                  )}
                </td>
                <td className="col-hide-mobile">
                  <span className="added-by">
                    <i className="fa-regular fa-user" style={{ fontSize: 12 }} />
                    {m.addedBy}
                  </span>
                </td>
                <td className="col-hide-mobile">
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