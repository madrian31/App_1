import { UNCATEGORIZED, type MonthPoint, type ReportPreset } from "../../hooks/useMembersAttendanceReport";
import { YOUTH, isYouthCategory, youthSubLabel } from "../../types/member";

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "thisMonth", label: "This Month" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisQuarter", label: "This Quarter" },
  { value: "thisYear", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

interface AttendanceReportRangePickerProps {
  preset: ReportPreset;
  onPresetChange: (preset: ReportPreset) => void;
  customFrom: MonthPoint;
  customTo: MonthPoint;
  onCustomFromChange: (point: MonthPoint) => void;
  onCustomToChange: (point: MonthPoint) => void;
  rangeLabel: string;
  totalSundaysInRange: number;
  /** "" = all categories, UNCATEGORIZED = members with no category, YOUTH = every Youth category. */
  category: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  hasUncategorized: boolean;
}

function yearOptions(centerYear: number): number[] {
  const years: number[] = [];
  for (let y = centerYear - 5; y <= centerYear + 1; y++) years.push(y);
  return years;
}

export default function AttendanceReportRangePicker({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  rangeLabel,
  totalSundaysInRange,
  category,
  onCategoryChange,
  categories,
  hasUncategorized,
}: AttendanceReportRangePickerProps) {
  const years = yearOptions(new Date().getFullYear());

  // "Youth Boys" and "Youth Girls" share one "Youth" choice; a second dropdown
  // then narrows it to Boys or Girls.
  const youthCategories = categories.filter(isYouthCategory);
  const departmentOptions = [
    ...categories.filter((c) => !isYouthCategory(c)).map((c) => ({ value: c, label: c })),
    ...(youthCategories.length ? [{ value: YOUTH, label: "Youth" }] : []),
  ].sort((a, b) => a.label.localeCompare(b.label));
  const youthSelected = category === YOUTH || isYouthCategory(category);

  return (
    <div className="members-card range-picker">
      <div className="range-picker-row">
        <div className="range-picker-field">
          <label htmlFor="report-range-preset">Period</label>
          <select
            id="report-range-preset"
            value={preset}
            onChange={(e) => onPresetChange(e.target.value as ReportPreset)}
          >
            {PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {preset === "custom" && (
          <div className="range-picker-custom">
            <div className="range-picker-field">
              <label>From</label>
              <div className="range-picker-select-group">
                <select
                  aria-label="From month"
                  value={customFrom.month}
                  onChange={(e) => onCustomFromChange({ ...customFrom, month: Number(e.target.value) })}
                >
                  {MONTHS_LONG.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="From year"
                  value={customFrom.year}
                  onChange={(e) => onCustomFromChange({ ...customFrom, year: Number(e.target.value) })}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="range-picker-field">
              <label>To</label>
              <div className="range-picker-select-group">
                <select
                  aria-label="To month"
                  value={customTo.month}
                  onChange={(e) => onCustomToChange({ ...customTo, month: Number(e.target.value) })}
                >
                  {MONTHS_LONG.map((m, i) => (
                    <option key={m} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="To year"
                  value={customTo.year}
                  onChange={(e) => onCustomToChange({ ...customTo, year: Number(e.target.value) })}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="range-picker-field">
          <label htmlFor="report-category">Department</label>
          <select
            id="report-category"
            value={youthSelected ? YOUTH : category}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="">All Departments</option>
            {departmentOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            {hasUncategorized && <option value={UNCATEGORIZED}>Uncategorized</option>}
          </select>
        </div>

        {youthSelected && (
          <div className="range-picker-field">
            <label htmlFor="report-youth">Youth</label>
            <select id="report-youth" value={category} onChange={(e) => onCategoryChange(e.target.value)}>
              <option value={YOUTH}>Boys &amp; Girls</option>
              {youthCategories.map((c) => (
                <option key={c} value={c}>
                  {youthSubLabel(c)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="range-picker-summary">
          <span className="range-picker-label">{rangeLabel}</span>
          <span className="badge badge-category attendance-count-badge">{totalSundaysInRange} Sundays</span>
        </div>
      </div>
    </div>
  );
}
