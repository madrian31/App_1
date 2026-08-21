import { findCategory, MONTHS, WEEKDAYS, type CalendarCategoryItem, type CalendarEvent } from "../../types/calendarEvent";
import { fmtTime } from "../../hooks/useCalendar";

interface Props {
  dateIso: string;
  events: CalendarEvent[];
  categories: CalendarCategoryItem[];
  onOpenEvent: (id: string) => void;
  onAddOnThisDay: () => void;
  onClose: () => void;
}

export default function DayEventsModal({ dateIso, events, categories, onOpenEvent, onAddOnThisDay, onClose }: Props) {
  const d = new Date(`${dateIso}T00:00:00`);
  const title = `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal day-modal">
        <div className="day-modal-header">
          <h2>{title}</h2>
          <button type="button" className="day-modal-close" aria-label="Close" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="day-modal-list">
          {events.length === 0 ? (
            <div className="day-modal-empty">No events on this day.</div>
          ) : (
            events.map((e) => {
              const c = findCategory(categories, e.cat);
              return (
                <div key={e.id} className="day-modal-row" onClick={() => onOpenEvent(e.id)}>
                  <div className="bar" style={{ background: c.color }} />
                  <i className={`cat-icon ${c.icon}`} style={{ color: c.color }} aria-hidden="true" />
                  <div className="info">
                    <div className="title">{e.title}</div>
                    <div className="meta">
                      {e.allDay ? "All day" : `${fmtTime(e.start)} – ${fmtTime(e.end)}`} · {c.label}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="day-modal-footer">
          <button type="button" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={onAddOnThisDay}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> Add event on this day
          </button>
        </div>
      </div>
    </div>
  );
}