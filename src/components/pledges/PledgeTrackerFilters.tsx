import type { Member } from "../../types/member";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PledgeTrackerFiltersProps {
  pledgers: Member[];
  loadingPledgers: boolean;
  memberId: string;
  onMemberChange: (id: string) => void;
  curMonth: number;
  onMonthChange: (month: number) => void;
  curYear: number;
  onYearChange: (year: number) => void;
  years: number[];
  onExportCSV: () => void;
  exportDisabled: boolean;
}

export default function PledgeTrackerFilters({
  pledgers,
  loadingPledgers,
  memberId,
  onMemberChange,
  curMonth,
  onMonthChange,
  curYear,
  onYearChange,
  years,
  onExportCSV,
  exportDisabled,
}: PledgeTrackerFiltersProps) {
  return (
    <div className="toolbar">
      <div className="filter-select-wrap" style={{ flex: 1, minWidth: 220 }}>
        <i className="fa-regular fa-user" aria-hidden="true" />
        <select value={memberId} onChange={(e) => onMemberChange(e.target.value)} style={{ width: "100%" }}>
          <option value="">-- Select Pledger --</option>
          {loadingPledgers ? (
            <option disabled>Loading…</option>
          ) : pledgers.length === 0 ? (
            <option disabled>No pledgers found</option>
          ) : (
            pledgers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.firstName} {m.lastName}
              </option>
            ))
          )}
        </select>
      </div>

      <div className="filter-select-wrap">
        <i className="fa-regular fa-calendar" aria-hidden="true" />
        <select value={curMonth} onChange={(e) => onMonthChange(Number(e.target.value))}>
          {MONTHS.map((m, i) => (
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
    </div>
  );
}
