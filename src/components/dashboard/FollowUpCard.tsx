import { Link } from "react-router-dom";
import { FOLLOW_UP_MISSED_SUNDAYS } from "../../hooks/useMembersAttendanceReport";
import type { DashboardAttendance } from "../../hooks/useDashboard";
import DashboardPanel, { PanelMessage } from "./DashboardPanel";
import { fmtShortDate, LOAD_ERROR_TEXT } from "./dashboardFormat";

/** More than this and the rest are left to the Attendance Report. */
const MAX_NAMES = 8;

interface FollowUpCardProps {
  attendance: DashboardAttendance | null; // null while loading
  error: boolean;
}

export default function FollowUpCard({ attendance, error }: FollowUpCardProps) {
  const followUp = attendance?.followUp ?? null;
  const sundays = attendance?.followUpSundays ?? [];
  const shown = followUp?.slice(0, MAX_NAMES) ?? [];
  const hidden = (followUp?.length ?? 0) - shown.length;

  return (
    <DashboardPanel
      icon="fa-solid fa-user-clock"
      title="Needs Follow-up"
      subtitle={
        followUp
          ? `Absent on ${sundays
              .slice()
              .reverse()
              .map(fmtShortDate)
              .join(", ")}`
          : undefined
      }
      link={{ to: "/MembersAttendanceReport", label: "Attendance report" }}
    >
      {error ? (
        <PanelMessage>{LOAD_ERROR_TEXT}</PanelMessage>
      ) : attendance === null ? (
        <PanelMessage>Loading…</PanelMessage>
      ) : followUp === null ? (
        <PanelMessage>
          This list appears once attendance has been recorded for {FOLLOW_UP_MISSED_SUNDAYS} Sundays.
        </PanelMessage>
      ) : followUp.length === 0 ? (
        <PanelMessage>
          Every member attended at least once in the last {FOLLOW_UP_MISSED_SUNDAYS} recorded Sundays.
        </PanelMessage>
      ) : (
        <>
          <ul className="dash-list">
            {shown.map((m) => (
              <li className="dash-list-item" key={m.id}>
                <Link to={`/Profile/${m.id}`} className="dash-person">
                  {m.name}
                </Link>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <p className="dash-more">And {hidden} more — see the Attendance Report.</p>
          )}
        </>
      )}
    </DashboardPanel>
  );
}
