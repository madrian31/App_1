import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembersAttendanceReport from "../../hooks/useMembersAttendanceReport";
import AttendanceReportKpiStrip from "../../components/attendance/AttendanceReportKpiStrip";
import AttendanceReportTrendChart from "../../components/attendance/AttendanceReportTrendChart";
import AttendanceReportTable from "../../components/attendance/AttendanceReportTable";
import "./attendance.css";
import "./attendanceReport.css";

export default function AttendanceReport() {
  const {
    loading,
    viewYear,
    goPrevYear,
    goNextYear,
    sundayCounts,
    totalSundaysInYear,
    monthsShort,
    search,
    onSearchChange,
    paginatedRows,
    filteredCount,
    currentPage,
    totalPages,
    start,
    goFirst,
    goPrev,
    goNext,
    goLast,
    kpis,
    monthlyTrend,
  } = useMembersAttendanceReport();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page attendance-report-page">
          <p className="report-eyebrow">Attendance Report</p>
          <h1 className="report-title">Yearly Attendance Summary</h1>

          <AttendanceReportKpiStrip {...kpis} />

          <AttendanceReportTrendChart data={monthlyTrend} year={viewYear} />

          <AttendanceReportTable
            rows={paginatedRows}
            sundayCounts={sundayCounts}
            monthsShort={monthsShort}
            loading={loading}
            viewYear={viewYear}
            totalSundaysInYear={totalSundaysInYear}
            goPrevYear={goPrevYear}
            goNextYear={goNextYear}
            search={search}
            onSearchChange={onSearchChange}
            filteredCount={filteredCount}
            currentPage={currentPage}
            totalPages={totalPages}
            start={start}
            goFirst={goFirst}
            goPrev={goPrev}
            goNext={goNext}
            goLast={goLast}
          />
        </div>
      </main>
    </div>
  );
}
