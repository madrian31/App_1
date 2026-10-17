import { kpiLabel, type KpiFilter } from "../../hooks/useMembersAttendanceReport";

interface AttendanceReportKpiStripProps {
  totalMembers: number;
  attendanceRate: number;
  activeThisMonth: number;
  inactiveThisMonth: number;
  presentToday: number;
  perfectAttendance: number;
  needsFollowUp: number;
  /** Card currently filtering the table, if any. */
  activeFilter: KpiFilter | null;
  /** null = show everyone (the "Total Members" card). */
  onFilterChange: (filter: KpiFilter | null) => void;
  /** "Oct 2026" while a month is selected on the chart — cards then describe that month. */
  focusLabel: string | null;
}

interface KpiCard {
  key: string;
  icon: string;
  tone: string;
  value: number | string;
  label: string;
  alert?: boolean;
  /** undefined = not clickable; null = clears the filter. */
  filter?: KpiFilter | null;
}

export default function AttendanceReportKpiStrip({
  totalMembers,
  attendanceRate,
  activeThisMonth,
  inactiveThisMonth,
  presentToday,
  perfectAttendance,
  needsFollowUp,
  activeFilter,
  onFilterChange,
  focusLabel,
}: AttendanceReportKpiStripProps) {
  const cards: KpiCard[] = [
    { key: "total", icon: "fa-solid fa-people-group", tone: "purple", value: totalMembers, label: "Total Members", filter: null },
    { key: "rate", icon: "fa-solid fa-arrow-trend-up", tone: "blue", value: `${attendanceRate}%`, label: `Attendance Rate (${focusLabel ?? "Year"})`, filter: "rate" },
    { key: "active", icon: "fa-solid fa-calendar-check", tone: "green", value: activeThisMonth, label: kpiLabel("active", focusLabel), filter: "active" },
    { key: "inactive", icon: "fa-solid fa-calendar-xmark", tone: "gray", value: inactiveThisMonth, label: kpiLabel("inactive", focusLabel), filter: "inactive" },
    { key: "today", icon: "fa-solid fa-calendar-day", tone: "green", value: presentToday, label: "Present Today", filter: "today" },
    { key: "perfect", icon: "fa-solid fa-star", tone: "orange", value: perfectAttendance, label: kpiLabel("perfect", focusLabel), filter: "perfect" },
    { key: "followup", icon: "fa-solid fa-arrow-trend-down", tone: "red", value: needsFollowUp, label: kpiLabel("followup", focusLabel), alert: true, filter: "followup" },
  ];

  return (
    <div className="kpi-strip">
      {cards.map((c) => {
        const content = (
          <>
            <span className="kpi-icon">
              <i className={c.icon} aria-hidden="true" />
            </span>
            <span className="kpi-value">{c.value}</span>
            <span className="kpi-label">{c.label}</span>
          </>
        );
        const className = `kpi-card kpi-tone-${c.tone}${c.alert ? " kpi-card--alert" : ""}`;

        if (c.filter === undefined) {
          return (
            <div key={c.key} className={className}>
              {content}
            </div>
          );
        }

        const selected = c.filter !== null && c.filter === activeFilter;
        return (
          <button
            key={c.key}
            type="button"
            className={`${className} kpi-card--clickable${selected ? " kpi-card--selected" : ""}`}
            aria-pressed={c.filter === null ? undefined : selected}
            title={
              c.filter === null
                ? "Show all members"
                : c.filter === "rate"
                  ? "Sort the table by lowest attendance % first"
                  : `Show ${c.label} in the table`
            }
            onClick={() => onFilterChange(c.filter as KpiFilter | null)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
