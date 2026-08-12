import type { RosterFilter } from "../../hooks/useSundaySchoolRoster";

interface SundaySchoolRosterToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: RosterFilter;
  onFilterChange: (value: RosterFilter) => void;
}

export default function SundaySchoolRosterToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: SundaySchoolRosterToolbarProps) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name or nickname…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-select-wrap">
        <i className="fa-solid fa-filter" aria-hidden="true" />
        <select value={filter} onChange={(e) => onFilterChange(e.target.value as RosterFilter)}>
          <option value="active">Active</option>
          <option value="dropped">Dropped</option>
          <option value="all">All</option>
        </select>
      </div>
    </div>
  );
}
