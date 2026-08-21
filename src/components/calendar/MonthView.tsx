import { categorySoftBg, findCategory, WEEKDAYS, type CalendarCategoryItem, type CalendarEvent } from "../../types/calendarEvent";
import { addDays, iso, sameDay } from "../../hooks/useCalendar";

interface Props {
  currentDate: Date;
  today: Date;
  categories: CalendarCategoryItem[];
  eventsForDay: (d: Date) => CalendarEvent[];
  onOpenDay: (dateIso: string) => void;
  onOpenEvent: (id: string) => void;
}

export default function MonthView({ currentDate, today, categories, eventsForDay, onOpenDay, onOpenEvent }: Props) {
  const firstOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = addDays(firstOfMonth, -startOffset);

  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <>
      <div className="month-weekdays">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="month-grid">
        {cells.map((cellDate) => {
          const outside = cellDate.getMonth() !== currentDate.getMonth();
          const isToday = sameDay(cellDate, today);
          const dayEvents = eventsForDay(cellDate);
          const visible = dayEvents.slice(0, 3);
          const extra = dayEvents.length - visible.length;
          const dateKey = iso(cellDate);

          return (
            <div
              key={dateKey}
              className={`day-cell${outside ? " outside" : ""}${dayEvents.length > 0 ? " has-events" : ""}`}
              onClick={() => dayEvents.length > 0 && onOpenDay(dateKey)}
            >
              <div className="day-num-wrap">
                {isToday && <span className="today-ring" />}
                <span className="day-num">{cellDate.getDate()}</span>
              </div>
              <div className="day-events">
                {visible.map((e) => {
                  const c = findCategory(categories, e.cat);
                  return (
                    <div
                      key={e.id}
                      className="evt-chip"
                      style={{ background: categorySoftBg(c.color), color: c.color }}
                      title={e.title}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        onOpenEvent(e.id);
                      }}
                    >
                      <i className={c.icon} aria-hidden="true" />
                      {e.title}
                    </div>
                  );
                })}
                {extra > 0 && <div className="evt-more">+{extra} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}