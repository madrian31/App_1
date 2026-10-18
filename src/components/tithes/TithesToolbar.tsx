import { TITHE_MONTHS } from "../../hooks/useTithes";

interface TithesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  curMonth: number;
  onMonthChange: (month: number) => void;
  curYear: number;
  onYearChange: (year: number) => void;
  years: number[];
  canManage: boolean;
  onAddEntry: () => void;
  onExportCSV: () => void;
  exportDisabled: boolean;
}

export default function TithesToolbar({
  search,
  onSearchChange,
  curMonth,
  onMonthChange,
  curYear,
  onYearChange,
  years,
  canManage,
  onAddEntry,
  onExportCSV,
  exportDisabled,
}: TithesToolbarProps) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name or notes…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-select-wrap">
        <i className="fa-regular fa-calendar" aria-hidden="true" />
        <select value={curMonth} onChange={(e) => onMonthChange(Number(e.target.value))}>
          {TITHE_MONTHS.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-select-wrap">
        <select value={curYear} onChange={(e) => onYearChange(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <button className="btn-secondary" onClick={onExportCSV} disabled={exportDisabled}>
        <i className="fa-solid fa-file-export" aria-hidden="true" />
        Export CSV
      </button>

      {canManage && (
        <button className="btn-add" onClick={onAddEntry}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add Tithe
        </button>
      )}
    </div>
  );
}
