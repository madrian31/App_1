import { Link } from "react-router-dom";
import { FOLLOW_UP_MISSED_SUNDAYS, MONTHS_SHORT } from "../../hooks/useMembersAttendanceReport";
import { MONTHS } from "../../hooks/useAttendanceTracker";
import type { DashboardAttendance } from "../../hooks/useDashboard";
import { fmtShortDate } from "./dashboardFormat";

interface DashboardKpiStripProps {
  attendance: DashboardAttendance | null; // null while loading
  today: Date;
}

const REPORT_PATH = "/MembersAttendanceReport";

function ChangeVsPrevious({ attendance }: { attendance: DashboardAttendance }) {
  const { latest, previous } = attendance;
  if (!latest || !previous) return null;
  const diff = latest.members - previous.members;
  const when = fmtShortDate(previous.date);
  if (diff === 0) return <span className="dash-kpi-sub">Same as {when}</span>;
  return (
    <span className={`dash-kpi-sub ${diff > 0 ? "dash-up" : "dash-down"}`}>
      <i className={`fa-solid ${diff > 0 ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`} aria-hidden="true" />{" "}
      {Math.abs(diff)} {diff > 0 ? "more" : "fewer"} than {when}
    </span>
  );
}

export default function DashboardKpiStrip({ attendance, today }: DashboardKpiStripProps) {
  const loading = attendance === null;
  const latest = attendance?.latest ?? null;
  const followUp = attendance?.followUp ?? null;
  const monthName = MONTHS[today.getMonth()];

  return (
    <div className="summary-cards dash-kpis">
      <Link to={REPORT_PATH} className="summary-card">
        <span className="summary-card-label">
          {latest ? `Members present on Sunday, ${fmtShortDate(latest.date)}` : "Members present on Sunday"}
        </span>
        <span className="summary-card-value">{loading ? "…" : latest ? latest.members : "—"}</span>
        {!loading &&
          (latest ? (
            <ChangeVsPrevious attendance={attendance} />
          ) : (
            <span className="dash-kpi-sub">No attendance recorded in the last 8 weeks</span>
          ))}
      </Link>

      <Link to="/MembersVisitors" className="summary-card">
        <span className="summary-card-label">
          {latest ? `Visitors on Sunday, ${fmtShortDate(latest.date)}` : "Visitors on Sunday"}
        </span>
        <span className="summary-card-value">{loading ? "…" : latest ? latest.visitors : "—"}</span>
      </Link>

      <Link to={REPORT_PATH} className="summary-card">
        <span className="summary-card-label">Attendance in {monthName}</span>
        <span className="summary-card-value">
          {loading ? "…" : attendance.monthRate === null ? "—" : `${attendance.monthRate}%`}
        </span>
        {!loading && (
          <span className="dash-kpi-sub">
            {attendance.monthAverage === null
              ? `No Sundays recorded yet in ${MONTHS_SHORT[today.getMonth()]}`
              : `About ${attendance.monthAverage} of ${attendance.totalMembers} members each Sunday`}
          </span>
        )}
      </Link>

      <Link
        to={REPORT_PATH}
        className={`summary-card${followUp && followUp.length > 0 ? " dash-kpi-alert" : ""}`}
      >
        <span className="summary-card-label">Needs follow-up</span>
        <span className="summary-card-value">{loading ? "…" : followUp === null ? "—" : followUp.length}</span>
        {!loading && (
          <span className="dash-kpi-sub">
            {followUp === null
              ? `Needs ${FOLLOW_UP_MISSED_SUNDAYS} Sundays of attendance recorded`
              : `Absent the last ${FOLLOW_UP_MISSED_SUNDAYS} recorded Sundays`}
          </span>
        )}
      </Link>
    </div>
  );
}
