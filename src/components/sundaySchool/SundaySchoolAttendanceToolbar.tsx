interface SundaySchoolAttendanceToolbarProps {
  monthLabel: string;
  sundayCount: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function SundaySchoolAttendanceToolbar({
  monthLabel,
  sundayCount,
  onPrevMonth,
  onNextMonth,
  onToday,
  search,
  onSearchChange,
}: SundaySchoolAttendanceToolbarProps) {
  return (
    <div className="toolbar attendance-toolbar">
      <div className="month-nav">
        <button type="button" className="nav-btn" onClick={onPrevMonth} aria-label="Previous month">
          <i className="fa-solid fa-chevron-left" />
        </button>

        <div className="month-nav-label">
          {monthLabel}
          <span className="count-pill">
            {sundayCount} Sunday{sundayCount !== 1 ? "s" : ""}
          </span>
        </div>

        <button type="button" className="nav-btn" onClick={onNextMonth} aria-label="Next month">
          <i className="fa-solid fa-chevron-right" />
        </button>

        <button type="button" className="today-btn" onClick={onToday}>
          Today
        </button>
      </div>

      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search child…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
