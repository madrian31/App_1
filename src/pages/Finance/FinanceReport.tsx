import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useFinanceReport, { FINANCE_PERIOD_MODES } from "../../hooks/useFinanceReport";
import FinanceCategoryTable from "../../components/finance/FinanceCategoryTable";
import FinanceKpiStrip from "../../components/finance/FinanceKpiStrip";
import FinanceMonthFlow from "../../components/finance/FinanceMonthFlow";
import FinanceTrendChart from "../../components/finance/FinanceTrendChart";
import FinanceMonthlyTable from "../../components/finance/FinanceMonthlyTable";
import FinanceServiceTable from "../../components/finance/FinanceServiceTable";
import { exportFinanceReportPdf } from "../../services/finance/financeReportPdf";
import "../Ledger/ledger.css";
import "../Pledges/pledgesMembers.css";
import "../Attendance/attendanceReport.css";
import "./finance.css";

export default function FinanceReport() {
  const {
    mode,
    chooseMode,
    stepPeriod,
    goToCurrent,
    currentPeriod,
    canStepForward,
    dateFrom,
    dateTo,
    changeDateFrom,
    changeDateTo,
    selectMonth,
    loading,
    error,
    fundBalance,
    startingBalanceSet,
    periodLabel,
    periodTithes,
    periodOfferings,
    periodIncome,
    periodExpenses,
    changePct,
    ytdIncome,
    ytdYear,
    startBalance,
    endBalance,
    months,
    selectedMonthKey,
    services,
    expenseCategories,
  } = useFinanceReport();

  const [exporting, setExporting] = useState(false);
  // A period inside one month charts that month's whole year for context.
  const chartTitle = selectedMonthKey ? String(months[0]?.year ?? "") : periodLabel;

  async function handleExportPdf() {
    setExporting(true);
    try {
      await exportFinanceReportPdf({
        periodLabel,
        chartTitle,
        fundBalance,
        periodTithes,
        periodOfferings,
        periodIncome,
        periodExpenses,
        ytdIncome,
        ytdYear,
        startBalance,
        endBalance,
        months,
        services,
        expenseCategories,
      });
    } catch (err) {
      console.error("Failed to export finance report:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Finance Report</h1>
              <p>General Fund — {periodLabel}</p>
            </div>
            <div className="page-header-actions">
              <button className="btn-secondary" onClick={handleExportPdf} disabled={loading || exporting}>
                <i className="fa-solid fa-file-pdf" aria-hidden="true" />
                {exporting ? "Exporting…" : "Export PDF"}
              </button>
            </div>
          </div>

          <div className="finance-period">
            <div className="finance-period-modes" role="group" aria-label="Report period type">
              {FINANCE_PERIOD_MODES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={mode === p.value ? "is-active" : undefined}
                  aria-pressed={mode === p.value}
                  onClick={() => chooseMode(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {mode === "custom" ? (
              <div className="finance-date-range">
                <label>
                  <span>From</span>
                  <input type="date" value={dateFrom} onChange={(e) => changeDateFrom(e.target.value)} />
                </label>
                <span className="month-range-arrow" aria-hidden="true">→</span>
                <label>
                  <span>To</span>
                  <input type="date" value={dateTo} onChange={(e) => changeDateTo(e.target.value)} />
                </label>
              </div>
            ) : (
              <>
                <div className="finance-period-stepper">
                  <button
                    type="button"
                    onClick={() => stepPeriod(-1)}
                    aria-label={mode === "month" ? "Previous month" : "Previous year"}
                    title={mode === "month" ? "Previous month" : "Previous year"}
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  </button>
                  <span className="finance-period-label" aria-live="polite">
                    {periodLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() => stepPeriod(1)}
                    disabled={!canStepForward}
                    aria-label={mode === "month" ? "Next month" : "Next year"}
                    title={mode === "month" ? "Next month" : "Next year"}
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                </div>
                {!currentPeriod && (
                  <button type="button" className="finance-period-today" onClick={goToCurrent}>
                    {mode === "month" ? "Back to this month" : "Back to this year"}
                  </button>
                )}
              </>
            )}
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          <FinanceKpiStrip
            loading={loading}
            fundBalance={fundBalance}
            startingBalanceSet={startingBalanceSet}
            periodLabel={periodLabel}
            periodTithes={periodTithes}
            periodOfferings={periodOfferings}
            periodIncome={periodIncome}
            changePct={changePct}
            ytdIncome={ytdIncome}
            ytdYear={ytdYear}
            periodExpenses={periodExpenses}
          />

          <section className="report-section">
            <FinanceMonthFlow
              loading={loading}
              periodLabel={periodLabel}
              startBalance={startBalance}
              periodTithes={periodTithes}
              periodOfferings={periodOfferings}
              periodExpenses={periodExpenses}
              endBalance={endBalance}
            />
          </section>

          <section className="report-section">
            <FinanceTrendChart
              months={months}
              title={chartTitle}
              selectedKey={selectedMonthKey}
              onSelectMonth={selectMonth}
            />
          </section>

          <div className="finance-report-grid">
            <section className="report-section">
              <h2 className="report-section-title">Monthly Breakdown — {chartTitle}</h2>
              <FinanceMonthlyTable
                months={months}
                loading={loading}
                selectedKey={selectedMonthKey}
                onSelectMonth={selectMonth}
              />
            </section>

            <section className="report-section">
              <h2 className="report-section-title">Collections per Service — {periodLabel}</h2>
              <FinanceServiceTable services={services} loading={loading} periodLabel={periodLabel} />
            </section>

            <section className="report-section">
              <h2 className="report-section-title">Expenses by Category — {periodLabel}</h2>
              <FinanceCategoryTable
                categories={expenseCategories}
                loading={loading}
                monthLabel={periodLabel}
                monthExpenses={periodExpenses}
              />
            </section>
          </div>

        </div>
      </main>
    </div>
  );
}
