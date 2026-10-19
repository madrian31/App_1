import { EVENTS_DAYS_AHEAD, type DashboardEvent } from "../../hooks/useDashboard";
import { fmtTime } from "../../hooks/useCalendar";
import DashboardPanel, { PanelMessage } from "./DashboardPanel";
import { LOAD_ERROR_TEXT, relativeDay } from "./dashboardFormat";

/** More than this and the rest are left to the Calendar page. */
const MAX_EVENTS = 6;

interface UpcomingEventsCardProps {
  events: DashboardEvent[] | null; // null while loading
  error: boolean;
  today: Date;
}

function eventTime({ allDay, start, end }: DashboardEvent["event"]): string {
  if (allDay || !start) return "All day";
  return end ? `${fmtTime(start)} – ${fmtTime(end)}` : fmtTime(start);
}

export default function UpcomingEventsCard({ events, error, today }: UpcomingEventsCardProps) {
  const shown = events?.slice(0, MAX_EVENTS) ?? [];
  const hidden = (events?.length ?? 0) - shown.length;

  return (
    <DashboardPanel
      icon="fa-solid fa-calendar-day"
      title="Upcoming Events"
      subtitle={`Next ${EVENTS_DAYS_AHEAD} days`}
      link={{ to: "/Calendar", label: "Open calendar" }}
    >
      {error ? (
        <PanelMessage>{LOAD_ERROR_TEXT}</PanelMessage>
      ) : events === null ? (
        <PanelMessage>Loading…</PanelMessage>
      ) : events.length === 0 ? (
        <PanelMessage>No events on the calendar for the next {EVENTS_DAYS_AHEAD} days.</PanelMessage>
      ) : (
        <>
          <ul className="dash-list">
            {shown.map(({ event, category }) => {
              const d = new Date(`${event.date}T00:00:00`);
              const when = relativeDay(event.date, today);
              const details = [eventTime(event), event.location, event.inCharge && `In charge: ${event.inCharge}`]
                .filter(Boolean)
                .join(" · ");
              return (
                <li className="dash-list-item dash-event" key={event.id}>
                  <span className={`dash-event-date${when === "Today" ? " is-today" : ""}`}>
                    <span className="dash-event-month">{d.toLocaleDateString("en-US", { month: "short" })}</span>
                    <span className="dash-event-day">{d.getDate()}</span>
                    <span className="dash-event-weekday">
                      {when ?? d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </span>
                  <div className="dash-event-info">
                    <p className="dash-event-title">{event.title}</p>
                    <p className="dash-event-meta">{details}</p>
                    {category && (
                      <span className="dash-event-cat">
                        <i className={category.icon} style={{ color: category.color }} aria-hidden="true" />
                        {category.label}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {hidden > 0 && (
            <p className="dash-more">
              And {hidden} more {hidden === 1 ? "event" : "events"} — see the Calendar.
            </p>
          )}
        </>
      )}
    </DashboardPanel>
  );
}
