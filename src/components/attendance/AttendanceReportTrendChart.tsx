import type { MonthlyTrendPoint } from "../../hooks/useMembersAttendanceReport";

interface AttendanceReportTrendChartProps {
  data: MonthlyTrendPoint[];
  rangeLabel: string;
  /** Key of the month currently filtering the table, if any. */
  selectedKey: string | null;
  onSelectMonth: (key: string) => void;
}

export default function AttendanceReportTrendChart({
  data,
  rangeLabel,
  selectedKey,
  onSelectMonth,
}: AttendanceReportTrendChartProps) {
  return (
    <div className="members-card trend-card">
      <div className="trend-header">
        <i className="fa-solid fa-chart-column" aria-hidden="true" />
        <h3>Attendance Trend — {rangeLabel}</h3>
        <span className="trend-hint">Click a month to see who attended</span>
      </div>

      <div className="trend-chart">
        {data.map((point) => {
          const selected = point.key === selectedKey;
          return (
            <button
              key={point.key}
              type="button"
              className={`trend-col${selected ? " trend-col--selected" : ""}`}
              disabled={!point.hasData}
              aria-pressed={selected}
              title={
                point.hasData
                  ? `${point.label}: ${point.attended}/${point.possible} (${point.percent}%) — click to see who attended`
                  : `${point.label}: no Sundays yet`
              }
              onClick={() => onSelectMonth(point.key)}
            >
              <div className="trend-bar-track">
                {point.percent > 0 && (
                  <div className="trend-bar" style={{ height: `${Math.max(point.percent, 6)}%` }} />
                )}
              </div>
              <span className="trend-label">{point.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
