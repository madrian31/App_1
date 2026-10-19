import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useFinanceReport, { FINANCE_PRESETS } from "../../hooks/useFinanceReport";
import FinanceCategoryTable from "../../components/finance/FinanceCategoryTable";
import FinanceKpiStrip from "../../components/finance/FinanceKpiStrip";
import FinanceMonthFlow from "../../components/finance/FinanceMonthFlow";
import FinanceTrendChart from "../../components/finance/FinanceTrendChart";
import FinanceMonthlyTable from "../../components/finance/FinanceMonthlyTable";
import FinanceSundayTable from "../../components/finance/FinanceSundayTable";
import OpeningBalanceModal from "../../components/finance/OpeningBalanceModal";
import { exportFinanceReportPdf } from "../../services/finance/financeReportPdf";
import "../Ledger/ledger.css";
import "../Pledges/pledgesMembers.css";
import "../Attendance/attendanceReport.css";
import "./finance.css";

// TODO: replace with the actual logged-in user once auth/session wiring is in place.
const CURRENT_USER = "Unknown";

export default function FinanceReport() {
  const {
    preset,
    choosePreset,
    dateFrom,
    dateTo,
    changeDateFrom,
    changeDateTo,
    selectMonth,
    loading,
    error,
    fundBalance,
    openingBalance,
    openingDate,
    openingSet,
    showOpeningForm,
    setShowOpeningForm,
    savingOpening,
    saveOpening,
    periodLabel,
    periodTithes,
    periodExpenses,
    changePct,
    ytdTithes,
    ytdYear,
    startBalance,
    endBalance,
    months,
    selectedMonthKey,
    sundays,
    expenseCategories,
  } = useFinanceReport(CURRENT_USER);

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
        openingBalance,
        openingDate,
        periodTithes,
        periodExpenses,
        ytdTithes,
        ytdYear,
        startBalance,
        endBalance,
        months,
        sundays,
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

          <div className="toolbar-row report-range-row">
            <div className="quick-range-group" role="group" aria-label="Report period">
              {FINANCE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`quick-range-btn${preset === p.value ? " active" : ""}`}
                  aria-pressed={preset === p.value}
                  onClick={() => choosePreset(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>

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
            openingBalance={openingBalance}
            openingDate={openingDate}
            openingSet={openingSet}
            periodLabel={periodLabel}
            periodTithes={periodTithes}
            changePct={changePct}
            ytdTithes={ytdTithes}
            ytdYear={ytdYear}
            periodExpenses={periodExpenses}
            onEditOpening={() => setShowOpeningForm(true)}
          />

          <section className="report-section">
            <FinanceMonthFlow
              loading={loading}
              periodLabel={periodLabel}
              startBalance={startBalance}
              periodTithes={periodTithes}
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
              <h2 className="report-section-title">Tithes per Sunday — {periodLabel}</h2>
              <FinanceSundayTable
                sundays={sundays}
                loading={loading}
                monthLabel={periodLabel}
                monthTotal={periodTithes}
              />
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

          {showOpeningForm && (
            <OpeningBalanceModal
              openingBalance={openingBalance}
              openingDate={openingDate}
              saving={savingOpening}
              onSave={saveOpening}
              onClose={() => setShowOpeningForm(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
