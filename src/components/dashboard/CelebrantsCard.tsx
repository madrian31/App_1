import { Link } from "react-router-dom";
import { MONTHS } from "../../hooks/useAttendanceTracker";
import type { DashboardCelebrant } from "../../hooks/useDashboard";
import DashboardPanel, { PanelMessage } from "./DashboardPanel";
import { fmtDayDate, LOAD_ERROR_TEXT, relativeDay } from "./dashboardFormat";

interface CelebrantsCardProps {
  celebrants: { thisWeek: DashboardCelebrant[]; laterThisMonth: DashboardCelebrant[] } | null; // null while loading
  error: boolean;
  today: Date;
}

function CelebrantList({ items, today }: { items: DashboardCelebrant[]; today: Date }) {
  return (
    <ul className="dash-list">
      {items.map((c, i) => {
        const when = relativeDay(c.date, today);
        return (
          <li className="dash-list-item" key={`${c.memberId}-${c.type}-${i}`}>
            <span className={`dash-date-chip${when === "Today" ? " is-today" : ""}`}>
              {when ?? fmtDayDate(c.date)}
            </span>
            <Link to={`/Profile/${c.memberId}`} className="dash-person">
              {c.name}
            </Link>
            <span className={`badge celebrants-type-${c.type}`}>
              {c.type === "birthday" ? "Birthday" : "Anniversary"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function CelebrantsCard({ celebrants, error, today }: CelebrantsCardProps) {
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
            <CelebrantList items={celebrants.thisWeek} today={today} />
          )}

          {celebrants.laterThisMonth.length > 0 && (
            <>
              <h3 className="dash-group-label">Later in {monthName}</h3>
              <CelebrantList items={celebrants.laterThisMonth} today={today} />
            </>
          )}
        </>
      )}
    </DashboardPanel>
  );
}
