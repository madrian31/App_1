import { CATEGORIES, MONTHS, WEEKDAYS, type CalendarEvent } from "../../types/calendarEvent";
import { fmtTime, sameDay } from "../../hooks/useCalendar";

interface Props {
  entries: { e: CalendarEvent; d: Date }[];
  today: Date;
  onOpenEvent: (id: string) => void;
}

export default function AgendaView({ entries, today, onOpenEvent }: Props) {
  if (entries.length === 0) {
    return <div className="agenda-empty">No events match your filters. Try clearing a filter or search term.</div>;
  }

  let lastKey: string | null = null;

  return (
    <div className="agenda-list">
      {entries.map(({ e, d }) => {
        const key = e.date;
        const showDateHeader = key !== lastKey;
        lastKey = key;
        const c = CATEGORIES[e.cat];

        return (
          <div key={e.id}>
            {showDateHeader && (
              <div className="agenda-date">
                <span className="d1">
                  {WEEKDAYS[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}
                </span>
                {sameDay(d, today) && <span className="d2">Today</span>}
              </div>
            )}
            <div className="agenda-row" onClick={() => onOpenEvent(e.id)}>
              <div className="bar" style={{ background: c.color }} />
              <div className="time">{fmtTime(e.start)}</div>
              <div className="title">
                <i className={c.icon} aria-hidden="true" /> {e.title}
              </div>
              <div className="cat" style={{ background: c.soft, color: c.color }}>
                {c.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
