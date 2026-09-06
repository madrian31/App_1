interface AttendanceReportKpiStripProps {
  totalMembers: number;
  attendanceRate: number;
  activeThisMonth: number;
  inactiveThisMonth: number;
  presentToday: number;
  perfectAttendance: number;
  needsFollowUp: number;
}

export default function AttendanceReportKpiStrip({
  totalMembers,
  attendanceRate,
  activeThisMonth,
  inactiveThisMonth,
  presentToday,
  perfectAttendance,
  needsFollowUp,
}: AttendanceReportKpiStripProps) {
  const cards = [
    { key: "total", icon: "fa-solid fa-people-group", tone: "purple", value: totalMembers, label: "Total Members" },
    { key: "rate", icon: "fa-solid fa-arrow-trend-up", tone: "blue", value: `${attendanceRate}%`, label: "Attendance Rate (Year)" },
    { key: "active", icon: "fa-solid fa-calendar-check", tone: "green", value: activeThisMonth, label: "Active This Month" },
    { key: "inactive", icon: "fa-solid fa-calendar-xmark", tone: "gray", value: inactiveThisMonth, label: "Inactive This Month" },
    { key: "today", icon: "fa-solid fa-calendar-day", tone: "green", value: presentToday, label: "Present Today" },
    { key: "perfect", icon: "fa-solid fa-star", tone: "orange", value: perfectAttendance, label: "Perfect Attendance" },
    { key: "followup", icon: "fa-solid fa-arrow-trend-down", tone: "red", value: needsFollowUp, label: "Needs Follow-up (3+ absences)", alert: true },
  ];

  return (
    <div className="kpi-strip">
      {cards.map((c) => (
        <div key={c.key} className={`kpi-card kpi-tone-${c.tone}${c.alert ? " kpi-card--alert" : ""}`}>
          <span className="kpi-icon">
            <i className={c.icon} aria-hidden="true" />
          </span>
          <span className="kpi-value">{c.value}</span>
          <span className="kpi-label">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
