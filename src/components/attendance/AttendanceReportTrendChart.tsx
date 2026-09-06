import type { MonthlyTrendPoint } from "../../hooks/useMembersAttendanceReport";

interface AttendanceReportTrendChartProps {
  data: MonthlyTrendPoint[];
  rangeLabel: string;
}

export default function AttendanceReportTrendChart({ data, rangeLabel }: AttendanceReportTrendChartProps) {
  return (
    <div className="members-card trend-card">
      <div className="trend-header">
        <i className="fa-solid fa-chart-column" aria-hidden="true" />
        <h3>Attendance Trend — {rangeLabel}</h3>
      </div>

      <div className="trend-chart">
        {data.map((point) => (
          <div key={point.key} className="trend-col">
            <div className="trend-bar-track">
              {point.percent > 0 && (
                <div
                  className="trend-bar"
                  style={{ height: `${Math.max(point.percent, 6)}%` }}
                  title={`${point.label}: ${point.attended}/${point.possible} (${point.percent}%)`}
                />
              )}
            </div>
            <span className="trend-label">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}