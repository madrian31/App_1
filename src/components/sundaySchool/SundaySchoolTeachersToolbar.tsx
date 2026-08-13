import type { TeacherFilter } from "../../hooks/useSundaySchoolTeachers";

interface SundaySchoolTeachersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: TeacherFilter;
  onFilterChange: (value: TeacherFilter) => void;
}

export default function SundaySchoolTeachersToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: SundaySchoolTeachersToolbarProps) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-select-wrap">
        <i className="fa-solid fa-filter" aria-hidden="true" />
        <select value={filter} onChange={(e) => onFilterChange(e.target.value as TeacherFilter)}>
          <option value="all">All Members</option>
          <option value="teachers">Teachers Only</option>
          <option value="assistants">Assistant Teachers Only</option>
        </select>
      </div>
    </div>
  );
}
