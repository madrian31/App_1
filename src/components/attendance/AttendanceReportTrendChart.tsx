import type { MonthlyTrendPoint } from "../../hooks/useMembersAttendanceReport";

interface AttendanceReportTrendChartProps {
  data: MonthlyTrendPoint[];
  year: number;
}

export default function AttendanceReportTrendChart({ data, year }: AttendanceReportTrendChartProps) {
  return (
    <div className="members-card trend-card">
      <div className="trend-header">
        <i className="fa-solid fa-chart-column" aria-hidden="true" />
        <h3>Monthly Attendance Trend — {year}</h3>
      </div>

      <div className="trend-chart">
        {data.map((point) => (
          <div key={point.month} className="trend-col">
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
