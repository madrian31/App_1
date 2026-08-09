import type { Visit } from "../../types/visit";

interface VisitDetailsModalProps {
  visit: Visit;
  onClose: () => void;
}

function formatDisplayDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function VisitDetailsModal({ visit, onClose }: VisitDetailsModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Visit Details</h2>

        <dl className="visit-details-list">
          <dt>Member</dt>
          <dd>{visit.memberName}</dd>

          <dt>Date</dt>
          <dd>{formatDisplayDate(visit.date)}</dd>

          <dt>Department</dt>
          <dd>{visit.department}</dd>

          <dt>Leader</dt>
          <dd>{visit.leader}</dd>

          <dt>Purpose</dt>
          <dd>{visit.purpose}</dd>

          <dt>Participants</dt>
          <dd>
            {visit.participants.length === 0 ? (
              <span className="date-text">—</span>
            ) : (
              <ul className="visit-participants-list">
                {visit.participants.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </dd>

          <dt>Notes</dt>
          <dd>{visit.notes || <span className="date-text">—</span>}</dd>
        </dl>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
