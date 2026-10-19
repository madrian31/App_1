import { Link } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useDashboard from "../../hooks/useDashboard";
import DashboardKpiStrip from "../../components/dashboard/DashboardKpiStrip";
import UpcomingServicesCard from "../../components/dashboard/UpcomingServicesCard";
import CelebrantsCard from "../../components/dashboard/CelebrantsCard";
import UpcomingEventsCard from "../../components/dashboard/UpcomingEventsCard";
import FollowUpCard from "../../components/dashboard/FollowUpCard";
import { fmtLongDate } from "../../components/dashboard/dashboardFormat";
import "../Visitation/visitation.css";
import "../ProgramLineUp/programLineUp.css";
import "./dashboard.css";

export default function Dashboard() {
  const { today, attendance, peopleError, celebrants, services, servicesError, upcomingEvents, eventsError } =
    useDashboard();

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

          {attendance?.unrecordedSunday && (
            <div className="dash-notice">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              <span>
                Attendance for {fmtLongDate(attendance.unrecordedSunday)} has not been recorded yet.{" "}
                <Link to="/MembersAttendance">Record attendance</Link>
              </span>
            </div>
          )}

          {peopleError ? (
            <div className="dash-notice dash-notice-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              <span>Could not load attendance. Please refresh the page.</span>
            </div>
          ) : (
            <DashboardKpiStrip attendance={attendance} today={today} />
          )}

          <div className="dash-grid">
            <UpcomingServicesCard services={services} error={servicesError} today={today} />
            <CelebrantsCard celebrants={celebrants} error={peopleError} today={today} />
            <UpcomingEventsCard events={upcomingEvents} error={eventsError} today={today} />
            <FollowUpCard attendance={attendance} error={peopleError} />
          </div>
        </div>
      </main>
    </div>
  );
}
