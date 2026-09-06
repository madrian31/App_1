import type { MonthPoint, ReportPreset } from "../../hooks/useMembersAttendanceReport";

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
}: AttendanceReportRangePickerProps) {
  const years = yearOptions(new Date().getFullYear());

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

        <div className="range-picker-summary">
          <span className="range-picker-label">{rangeLabel}</span>
          <span className="badge badge-category attendance-count-badge">{totalSundaysInRange} Sundays</span>
        </div>
      </div>
    </div>
  );
}
