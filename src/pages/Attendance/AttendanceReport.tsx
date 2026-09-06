import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembersAttendanceReport from "../../hooks/useMembersAttendanceReport";
import AttendanceReportRangePicker from "../../components/attendance/AttendanceReportRangePicker";
import AttendanceReportKpiStrip from "../../components/attendance/AttendanceReportKpiStrip";
import AttendanceReportTrendChart from "../../components/attendance/AttendanceReportTrendChart";
import AttendanceReportTable from "../../components/attendance/AttendanceReportTable";
import "./attendance.css";
import "./attendanceReport.css";

export default function AttendanceReport() {
  const {
    loading,
    preset,
    setPreset,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    rangeLabel,
    totalSundaysInRange,
    monthLabels,
    sundayCounts,
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
          <h1 className="report-title">Attendance Summary</h1>

          <AttendanceReportRangePicker
            preset={preset}
            onPresetChange={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            rangeLabel={rangeLabel}
            totalSundaysInRange={totalSundaysInRange}
          />

          <AttendanceReportKpiStrip {...kpis} />

          <AttendanceReportTrendChart data={monthlyTrend} rangeLabel={rangeLabel} />

          <AttendanceReportTable
            rows={paginatedRows}
            sundayCounts={sundayCounts}
            monthLabels={monthLabels}
            loading={loading}
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