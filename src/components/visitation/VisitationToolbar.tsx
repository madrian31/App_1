import type { QuickRange } from "../../hooks/useVisitation";

interface VisitationToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  department: string;
  onDepartmentChange: (value: string) => void;
  departments?: string[];

  quickRange: QuickRange;
  onQuickRangeChange: (range: QuickRange) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;

  onApplyFilter: () => void;
  onResetFilter: () => void;

  onAddVisit?: () => void;
}

const QUICK_RANGES: { value: QuickRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

const DEFAULT_DEPARTMENTS = ["Men's Dept.", "Women's Dept.", "Youth Dept."];

export default function VisitationToolbar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  departments = DEFAULT_DEPARTMENTS,
  quickRange,
  onQuickRangeChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApplyFilter,
  onResetFilter,
  onAddVisit,
}: VisitationToolbarProps) {
  return (
    <div className="toolbar visitation-toolbar">
      <div className="toolbar-row">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search member…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="filter-select-wrap">
          <i className="fa-solid fa-building-columns" aria-hidden="true" />
          <select value={department} onChange={(e) => onDepartmentChange(e.target.value)}>
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {onAddVisit && (
          <button className="btn-add" onClick={onAddVisit}>
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Record Visit
          </button>
        )}
      </div>

      <div className="toolbar-row">
        <div className="quick-range-group">
          {QUICK_RANGES.map((r) => (
            <button
              key={r.value}
              className={`quick-range-btn${quickRange === r.value ? " active" : ""}`}
              onClick={() => onQuickRangeChange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {quickRange === "custom" && (
          <div className="date-range-wrap">
            <input
              type="date"
              className="date-input"
              value={dateFrom}
              max={dateTo}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
            <span className="date-range-arrow">→</span>
            <input
              type="date"
              className="date-input"
              value={dateTo}
              min={dateFrom}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        )}

        <div className="filter-actions">
          <button className="btn-primary" onClick={onApplyFilter}>
            Filter
          </button>
          <button className="btn-secondary" onClick={onResetFilter}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
