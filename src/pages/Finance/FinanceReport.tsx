import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useFinanceReport, { FINANCE_MONTHS } from "../../hooks/useFinanceReport";
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
    curYear,
    setCurYear,
    curMonth,
    setCurMonth,
    years,
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
    monthTithes,
    monthChangePct,
    monthExpenses,
    monthStartBalance,
    monthEndBalance,
    ytdTithes,
    yearTithes,
    months,
    sundays,
    expenseCategories,
  } = useFinanceReport(CURRENT_USER);

  const [exporting, setExporting] = useState(false);
  const monthLabel = `${FINANCE_MONTHS[curMonth]} ${curYear}`;

  async function handleExportPdf() {
    setExporting(true);
    try {
      await exportFinanceReportPdf({
        year: curYear,
        monthLabel,
        fundBalance,
        openingBalance,
        openingDate,
        monthTithes,
        ytdTithes,
        monthExpenses,
        yearTithes,
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
              <p>General Fund — {monthLabel}</p>
            </div>
            <div className="page-header-actions">
              <button className="btn-secondary" onClick={handleExportPdf} disabled={loading || exporting}>
                <i className="fa-solid fa-file-pdf" aria-hidden="true" />
                {exporting ? "Exporting…" : "Export PDF"}
              </button>
            </div>
          </div>

          <div className="toolbar">
            <div className="filter-select-wrap">
              <i className="fa-regular fa-calendar" aria-hidden="true" />
              <select value={curMonth} onChange={(e) => setCurMonth(Number(e.target.value))}>
                {FINANCE_MONTHS.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-select-wrap">
              <select value={curYear} onChange={(e) => setCurYear(Number(e.target.value))}>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
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
            monthLabel={monthLabel}
            monthTithes={monthTithes}
            monthChangePct={monthChangePct}
            ytdTithes={ytdTithes}
            monthExpenses={monthExpenses}
            onEditOpening={() => setShowOpeningForm(true)}
          />

          <section className="report-section">
            <FinanceMonthFlow
              loading={loading}
              monthLabel={monthLabel}
              startBalance={monthStartBalance}
              monthTithes={monthTithes}
              monthExpenses={monthExpenses}
              endBalance={monthEndBalance}
            />
          </section>

          <section className="report-section">
            <FinanceTrendChart months={months} year={curYear} selectedMonth={curMonth} onSelectMonth={setCurMonth} />
          </section>

          <div className="finance-report-grid">
            <section className="report-section">
              <h2 className="report-section-title">Monthly Breakdown — {curYear}</h2>
              <FinanceMonthlyTable
                months={months}
                loading={loading}
                yearTithes={yearTithes}
                selectedMonth={curMonth}
                onSelectMonth={setCurMonth}
              />
            </section>

            <section className="report-section">
              <h2 className="report-section-title">Tithes per Sunday — {monthLabel}</h2>
              <FinanceSundayTable sundays={sundays} loading={loading} monthLabel={monthLabel} monthTotal={monthTithes} />
            </section>

            <section className="report-section">
              <h2 className="report-section-title">Expenses by Category — {monthLabel}</h2>
              <FinanceCategoryTable
                categories={expenseCategories}
                loading={loading}
                monthLabel={monthLabel}
                monthExpenses={monthExpenses}
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
