import type { VisitorRow } from "../../hooks/useVisitors";
import { formatDisplayDate } from "../../utils/date";

interface VisitorsTableProps {
  visitors: VisitorRow[];
  loading: boolean;
  busyId: string | null;
  removeConfirmId: string | null;
  onMakeMember: (id: string) => void;
  onRequestRemove: (id: string) => void;
  onConfirmRemove: (id: string) => void;
  onCancelRemove: () => void;
}

function initials(m: { firstName: string; lastName: string }) {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

const COL_COUNT = 5; // Visitor, First Visit, Last Visit, Times Attended, Actions

export default function VisitorsTable({
  visitors,
  loading,
  busyId,
  removeConfirmId,
  onMakeMember,
  onRequestRemove,
  onConfirmRemove,
  onCancelRemove,
}: VisitorsTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Visitor</th>
            <th className="col-hide-mobile">First Visit</th>
            <th className="col-hide-mobile">Last Visit</th>
            <th>Times Attended</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <p>Loading visitors…</p>
                </div>
              </td>
            </tr>
          ) : visitors.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-user" />
                  <p>No visitors. New names from an attendance import will show up here.</p>
                </div>
              </td>
            </tr>
          ) : (
            visitors.map((m) => {
              const busy = busyId === m.id;
              return (
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
                  <td className="col-hide-mobile">
                    <span className="date-text">{m.firstVisit ? formatDisplayDate(m.firstVisit) : "—"}</span>
                  </td>
                  <td className="col-hide-mobile">
                    <span className="date-text">{m.lastVisit ? formatDisplayDate(m.lastVisit) : "—"}</span>
                  </td>
                  <td>
                    <span className="visitor-times">
                      {m.timesAttended} {m.timesAttended === 1 ? "time" : "times"}
                    </span>
                  </td>
                  <td>
                    {removeConfirmId === m.id ? (
                      <div className="visitor-confirm">
                        <span>Remove {m.firstName} and their attendance?</span>
                        <button className="btn-secondary visitor-danger" disabled={busy} onClick={() => onConfirmRemove(m.id)}>
                          {busy ? "Removing…" : "Remove"}
                        </button>
                        <button className="btn-secondary" disabled={busy} onClick={onCancelRemove}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="actions-cell">
                        <button className="btn-primary visitor-make-member" disabled={busy} onClick={() => onMakeMember(m.id)}>
                          <i className="fa-solid fa-user-check" aria-hidden="true" /> {busy ? "Saving…" : "Make Member"}
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Remove visitor"
                          disabled={busy}
                          onClick={() => onRequestRemove(m.id)}
                        >
                          <i className="fa-regular fa-trash-can" />
                        </button>
                      </div>
                    )}
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
