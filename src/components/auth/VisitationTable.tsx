import type { Visit } from "../../types/visit";

interface VisitationTableProps {
  visits: Visit[];
  loading: boolean;
  onView: (visit: Visit) => void;
  onEdit: (visit: Visit) => void;
  onDelete: (id: string) => void;
}

/** Formats an ISO date string (YYYY-MM-DD) as "Aug 9, 2026" for display. */
function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`); // avoid timezone shift
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const COL_COUNT = 7; // Date, Member, Department, Leader, Purpose, Participants, Actions

export default function VisitationTable({ visits, loading, onView, onEdit, onDelete }: VisitationTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Member</th>
            <th className="col-hide-mobile">Department</th>
            <th className="col-hide-mobile">Leader</th>
            <th>Purpose</th>
            <th>Participants</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <p>Loading visits…</p>
                </div>
              </td>
            </tr>
          ) : visits.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-calendar" />
                  <p>No visits found for the selected filters.</p>
                </div>
              </td>
            </tr>
          ) : (
            visits.map((v) => (
              <tr key={v.id}>
                <td>
                  <span className="date-text">{formatDisplayDate(v.date)}</span>
                </td>
                <td>
                  <span className="member-name">{v.memberName}</span>
                </td>
                <td className="col-hide-mobile">
                  <span className="badge badge-category">{v.department}</span>
                </td>
                <td className="col-hide-mobile">{v.leader}</td>
                <td>{v.purpose}</td>
                <td>
                  <span className="participants-count">
                    <i className="fa-solid fa-user-group" style={{ fontSize: 12 }} />
                    {v.participants.length}
                  </span>
                </td>
                <td>
                  <div className="actions-cell">
                    <button className="btn-icon" title="View" onClick={() => onView(v)}>
                      <i className="fa-regular fa-eye" />
                    </button>
                    <button className="btn-icon" title="Edit" onClick={() => onEdit(v)}>
                      <i className="fa-regular fa-pen-to-square" />
                    </button>
                    <button className="btn-icon danger" title="Delete" onClick={() => onDelete(v.id)}>
                      <i className="fa-regular fa-trash-can" />
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
