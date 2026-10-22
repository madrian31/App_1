import { Link } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useDashboard from "../../hooks/useDashboard";
import DashboardKpiStrip from "../../components/dashboard/DashboardKpiStrip";
import UpcomingServicesCard from "../../components/dashboard/UpcomingServicesCard";
import PraiseWorshipCard from "../../components/dashboard/PraiseWorshipCard";
import CelebrantsCard from "../../components/dashboard/CelebrantsCard";
import UpcomingEventsCard from "../../components/dashboard/UpcomingEventsCard";
import FollowUpCard from "../../components/dashboard/FollowUpCard";
import { fmtLongDate } from "../../components/dashboard/dashboardFormat";
import { useAuth } from "../../auth/authContext";
import { isStaff } from "../../types/auth";
import "../Visitation/visitation.css";
import "../ProgramLineUp/programLineUp.css";
import "./dashboard.css";

export default function Dashboard() {
  // Attendance numbers, follow-ups and member profiles are for staff; Users
  // get the line-ups, celebrants and events.
  const { user } = useAuth();
  const staff = isStaff(user?.role);
  const {
    today,
    attendance,
    peopleError,
    celebrants,
    services,
    servicesError,
    praiseWorship,
    praiseWorshipError,
    upcomingEvents,
    eventsError,
  } = useDashboard(staff);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Dashboard</h1>
              <p>{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>

          {staff && attendance?.unrecordedSunday && (
            <div className="dash-notice">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              <span>
                Attendance for {fmtLongDate(attendance.unrecordedSunday)} has not been recorded yet.{" "}
                <Link to="/MembersAttendance">Record attendance</Link>
              </span>
            </div>
          )}

          {!staff ? null : peopleError ? (
            <div className="dash-notice dash-notice-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              <span>Could not load attendance. Please refresh the page.</span>
            </div>
          ) : (
            <DashboardKpiStrip attendance={attendance} today={today} />
          )}

          <div className="dash-grid">
            <div className="dash-col">
              <UpcomingServicesCard services={services} error={servicesError} today={today} />
              <PraiseWorshipCard praiseWorship={praiseWorship} error={praiseWorshipError} today={today} />
              <CelebrantsCard celebrants={celebrants} error={peopleError} today={today} linkToProfiles={staff} />
            </div>
            <div className="dash-col">
              <UpcomingEventsCard events={upcomingEvents} error={eventsError} today={today} />
              {staff && <FollowUpCard attendance={attendance} error={peopleError} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
