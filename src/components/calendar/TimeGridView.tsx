import { CATEGORIES, WEEKDAYS, type CalendarEvent } from "../../types/calendarEvent";
import { addDays, fmtTime, sameDay, timeToMinutes } from "../../hooks/useCalendar";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am - 9pm

interface Props {
  numDays: number;
  currentDate: Date;
  today: Date;
  eventsForDay: (d: Date) => CalendarEvent[];
  onOpenEvent: (id: string) => void;
}

export default function TimeGridView({ numDays, currentDate, today, eventsForDay, onOpenEvent }: Props) {
  const start = numDays === 7 ? addDays(currentDate, -currentDate.getDay()) : currentDate;
  const days = Array.from({ length: numDays }, (_, i) => addDays(start, i));

  return (
    <div className="time-grid-wrap">
      <div className="time-grid" style={{ ["--cols" as string]: numDays }}>
        <div className="time-col-head time-gutter-head" />
        {days.map((day) => {
          const isToday = sameDay(day, today);
          return (
            <div key={day.toISOString()} className={`time-col-head${isToday ? " is-today" : ""}`}>
              <div className="wd">{WEEKDAYS[day.getDay()]}</div>
              <div className="dnum">{day.getDate()}</div>
            </div>
          );
        })}

        {HOURS.map((h) => {
          const label = `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;
          return (
            <div key={h} style={{ display: "contents" }}>
              <div className="time-gutter">{label}</div>
              {days.map((day) => {
                const dayEvents = eventsForDay(day).filter((e) => Math.floor(timeToMinutes(e.start) / 60) === h);
                return (
                  <div key={day.toISOString() + h} className="time-slot">
                    {dayEvents.map((e) => {
                      const c = CATEGORIES[e.cat];
                      return (
                        <div
                          key={e.id}
                          className="evt-block"
                          style={{ background: c.soft, color: c.color }}
                          onClick={() => onOpenEvent(e.id)}
                        >
                          <i className={c.icon} aria-hidden="true" /> {e.title}
                          <span className="t">{fmtTime(e.start)}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
