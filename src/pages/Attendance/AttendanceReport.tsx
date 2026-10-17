import { useRef, useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembersAttendanceReport, { KPI_FILTER_LABELS, type KpiFilter } from "../../hooks/useMembersAttendanceReport";
import KpiFilterNotice, { type KpiNotice } from "../../components/attendance/KpiFilterNotice";
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
    kpiFilter,
    onKpiFilterChange,
    countForKpi,
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

  const tableRef = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState<KpiNotice | null>(null);

  function selectKpi(filter: KpiFilter | null) {
    // Clicking the selected card again clears it, same as the hook does.
    const next = filter === kpiFilter ? null : filter;
    onKpiFilterChange(filter);

    const count = countForKpi(next);
    const people = `${count} member${count === 1 ? "" : "s"}`;
    setNotice({
      id: Date.now(),
      icon: next ? "fa-solid fa-filter" : "fa-solid fa-people-group",
      title: next ? `Showing: ${KPI_FILTER_LABELS[next]}` : "Showing all members",
      detail: next === "rate" ? `All ${people}, sorted by attendance %` : people,
    });

    // The table sits below the chart — bring it into view so the click visibly does something.
    if (next) {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

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

          <AttendanceReportKpiStrip {...kpis} activeFilter={kpiFilter} onFilterChange={selectKpi} />

          <AttendanceReportTrendChart data={monthlyTrend} rangeLabel={rangeLabel} />

          <div ref={tableRef} className="report-table-anchor">
          <AttendanceReportTable
            rows={paginatedRows}
            sundayCounts={sundayCounts}
            monthLabels={monthLabels}
            loading={loading}
            search={search}
            onSearchChange={onSearchChange}
            kpiFilter={kpiFilter}
            onClearKpiFilter={() => onKpiFilterChange(null)}
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
        </div>

        <KpiFilterNotice notice={notice} />
      </main>
    </div>
  );
}