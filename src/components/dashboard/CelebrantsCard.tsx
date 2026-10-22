import { Link } from "react-router-dom";
import { MONTHS } from "../../hooks/useAttendanceTracker";
import type { DashboardCelebrant } from "../../hooks/useDashboard";
import DashboardPanel, { PanelMessage } from "./DashboardPanel";
import { fmtDayDate, LOAD_ERROR_TEXT, relativeDay } from "./dashboardFormat";

interface CelebrantsCardProps {
  celebrants: { thisWeek: DashboardCelebrant[]; laterThisMonth: DashboardCelebrant[] } | null; // null while loading
  error: boolean;
  today: Date;
  linkToProfiles?: boolean; // false for Users, who can't open member profiles
}

function CelebrantList({
  items,
  today,
  linkToProfiles,
}: {
  items: DashboardCelebrant[];
  today: Date;
  linkToProfiles: boolean;
}) {
  return (
    <ul className="dash-list">
      {items.map((c, i) => {
        const when = relativeDay(c.date, today);
        return (
          <li className="dash-list-item" key={`${c.memberId}-${c.type}-${i}`}>
            <span className={`dash-date-chip${when === "Today" ? " is-today" : ""}`}>
              {when ?? fmtDayDate(c.date)}
            </span>
            {linkToProfiles ? (
              <Link to={`/Profile/${c.memberId}`} className="dash-person">
                {c.name}
              </Link>
            ) : (
              <span className="dash-person">{c.name}</span>
            )}
            <span className={`badge celebrants-type-${c.type}`}>
              {c.type === "birthday" ? "Birthday" : "Anniversary"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function CelebrantsCard({ celebrants, error, today, linkToProfiles = true }: CelebrantsCardProps) {
  const monthName = MONTHS[today.getMonth()];

  return (
    <DashboardPanel icon="fa-solid fa-cake-candles" title="Birthdays & Anniversaries">
      {error ? (
        <PanelMessage>{LOAD_ERROR_TEXT}</PanelMessage>
      ) : celebrants === null ? (
        <PanelMessage>Loading…</PanelMessage>
      ) : (
        <>
          <h3 className="dash-group-label">Next 7 days</h3>
          {celebrants.thisWeek.length === 0 ? (
            <PanelMessage>No birthdays or anniversaries in the next 7 days.</PanelMessage>
          ) : (
            <CelebrantList items={celebrants.thisWeek} today={today} linkToProfiles={linkToProfiles} />
          )}

          {celebrants.laterThisMonth.length > 0 && (
            <>
              <h3 className="dash-group-label">Later in {monthName}</h3>
              <CelebrantList items={celebrants.laterThisMonth} today={today} linkToProfiles={linkToProfiles} />
            </>
          )}
        </>
      )}
    </DashboardPanel>
  );
}
