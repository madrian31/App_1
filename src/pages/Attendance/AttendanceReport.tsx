import { useEffect, useRef, useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembersAttendanceReport, { kpiLabel, type KpiFilter } from "../../hooks/useMembersAttendanceReport";
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
    categoryFilter,
    setCategoryFilter,
    categoryOptions,
    sundayCounts,
    search,
    onSearchChange,
    kpiFilter,
    onKpiFilterChange,
    monthFilter,
    monthFilterIndex,
    focusLabel,
    onMonthFilterChange,
    filterSummary,
    clearKpiFilter,
    clearMonthFilter,
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
  // Set by a card/bar click; the effect below announces the resulting filter
  // once the hook has recomputed, so the count always matches the table.
  const pendingNotice = useRef(false);

  useEffect(() => {
    if (!pendingNotice.current) return;
    pendingNotice.current = false;
    const filtered = !!kpiFilter || !!monthFilter;
    setNotice({
      id: Date.now(),
      icon: monthFilter ? "fa-solid fa-calendar-check" : filtered ? "fa-solid fa-filter" : "fa-solid fa-people-group",
      title: `Showing: ${filterSummary}`,
      detail: `${filteredCount} member${filteredCount === 1 ? "" : "s"}${kpiFilter === "rate" ? ", sorted by attendance %" : ""}`,
    });
    if (filtered) tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [kpiFilter, monthFilter, filterSummary, filteredCount]);

  function selectKpi(filter: KpiFilter | null) {
    // "Total Members" with no card selected changes nothing — no notice to show.
    if (filter === null && kpiFilter === null) return;
    pendingNotice.current = true;
    onKpiFilterChange(filter);
  }

  function selectMonth(key: string) {
    pendingNotice.current = true;
    onMonthFilterChange(key);
  }

  const filterChips = [
    ...(kpiFilter ? [{ key: "kpi", label: kpiLabel(kpiFilter, focusLabel), onClear: clearKpiFilter }] : []),
    ...(focusLabel ? [{ key: "month", label: `Month: ${focusLabel}`, onClear: clearMonthFilter }] : []),
  ];

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
            category={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={categoryOptions.categories}
            hasUncategorized={categoryOptions.hasUncategorized}
          />

          <AttendanceReportKpiStrip {...kpis} activeFilter={kpiFilter} onFilterChange={selectKpi} focusLabel={focusLabel} />

          <AttendanceReportTrendChart
            data={monthlyTrend}
            rangeLabel={rangeLabel}
            selectedKey={monthFilter}
            onSelectMonth={selectMonth}
          />

          <div ref={tableRef} className="report-table-anchor">
          <AttendanceReportTable
            rows={paginatedRows}
            sundayCounts={sundayCounts}
            monthLabels={monthLabels}
            loading={loading}
            search={search}
            onSearchChange={onSearchChange}
            filterChips={filterChips}
            highlightMonthIndex={monthFilterIndex}
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