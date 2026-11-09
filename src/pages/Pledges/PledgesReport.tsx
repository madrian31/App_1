import { Sidebar } from "../../components/sidebar/Sidebar";
import usePledgesReport, { MONTHS } from "../../hooks/usePledgesReport";
import PledgesMonthChart from "../../components/pledges/PledgesMonthChart";
import PledgesBreakdownTable from "../../components/pledges/PledgesBreakdownTable";
import PledgesExpensesTable from "../../components/pledges/PledgesExpensesTable";
import LedgerFormModal from "../../components/ledger/LedgerFormModal";
import { fmtPeso } from "../../components/finance/financeFormat";
import { useCurrentUserName } from "../../auth/authContext";
import "./pledgesMembers.css";
import "../Attendance/attendanceReport.css";
import "../Finance/finance.css";
import "../Ledger/ledger.css";

export default function PledgesReport() {
  const currentUser = useCurrentUserName();
  const {
    year,
    selectYear,
    years,
    month,
    setMonth,
    toggleMonth,
    periodLabel,
    loading,
    loaded,
    error,
    sundaysPerMonth,
    periodSundays,
    monthTotals,
    rows,
    pledgeTotal,
    totalDonations,
    totalCollected,
    totalExpenses,
    totalLoanOut,
    totalRepayment,
    netBalance,
    activePledgers,
    avgPerPledger,
    periodLedger,
    entryForm,
    savingEntry,
    entryError,
    canSaveEntry,
    openEntryForm,
    closeEntryForm,
    updateEntryForm,
    saveEntry,
    exportCSV,
  } = usePledgesReport(currentUser);

  const v = (n: number) => (loaded ? fmtPeso(n) : "…");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Pledges Report</h1>
              <p>{periodLabel}</p>
            </div>
            <div className="page-header-actions">
              {/* Month filter — scopes everything below except the monthly chart, whose bars also pick a month */}
              <div className="filter-select-wrap">
                <select
                  value={month === null ? "all" : String(month)}
                  onChange={(e) => setMonth(e.target.value === "all" ? null : Number(e.target.value))}
                  aria-label="Month"
                >
                  <option value="all">All Months</option>
                  {MONTHS.map((label, m) => (
                    <option key={label} value={m}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-select-wrap">
                <i className="fa-regular fa-calendar" aria-hidden="true" />
                <select value={year} onChange={(e) => selectYear(Number(e.target.value))} aria-label="Year">
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-secondary" onClick={exportCSV} disabled={!loaded}>
                <i className="fa-solid fa-file-export" aria-hidden="true" />
                Export CSV
              </button>
              {/* Same form as Pledges → Ledger: expense, loan, repayment, or donation */}
              <button className="btn-add" onClick={openEntryForm}>
                <i className="fa-solid fa-plus" aria-hidden="true" />
                Add Entry
              </button>
            </div>
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          {/* While another year loads, keep the current figures in place, dimmed */}
          <div className={`pledge-report-body${loading && loaded ? " is-refreshing" : ""}`}>
            <div className="summary-cards pledge-report-kpis">
              <div className="summary-card">
                <span className="summary-card-value">{v(totalCollected)}</span>
                <span className="summary-card-label">Total Collected</span>
                {totalDonations > 0 && (
                  <span className="pledge-kpi-note">
                    {fmtPeso(pledgeTotal)} from pledgers + {fmtPeso(totalDonations)} in donations
                  </span>
                )}
              </div>
              <div className="summary-card">
                <span className="summary-card-value">{v(totalExpenses)}</span>
                <span className="summary-card-label">Total Expenses</span>
              </div>
              <div className="summary-card">
                <span className={`summary-card-value ${netBalance < 0 ? "is-down" : "is-up"}`}>
                  {loaded ? (netBalance < 0 ? "−" : "") + fmtPeso(Math.abs(netBalance)) : "…"}
                </span>
                <span className="summary-card-label">Net Balance</span>
                {(totalLoanOut > 0 || totalRepayment > 0) && (
                  <span className="pledge-kpi-note">
                    After {fmtPeso(totalLoanOut)} loaned out and {fmtPeso(totalRepayment)} repaid
                  </span>
                )}
              </div>
              <div className="summary-card">
                <span className="summary-card-value">{loaded ? activePledgers : "…"}</span>
                <span className="summary-card-label">Pledgers Who Gave</span>
              </div>
              <div className="summary-card">
                <span className="summary-card-value">{v(avgPerPledger)}</span>
                <span className="summary-card-label">Average per Pledger</span>
              </div>
            </div>

            <section className="report-section">
              <PledgesMonthChart year={year} monthTotals={monthTotals} selectedMonth={month} onSelectMonth={toggleMonth} />
            </section>

            <section className="report-section">
              <PledgesBreakdownTable
                rows={rows}
                month={month}
                year={year}
                sundaysPerMonth={sundaysPerMonth}
                periodSundays={periodSundays}
                totalCollected={pledgeTotal}
                periodLabel={periodLabel}
              />
            </section>

            <section className="report-section">
              {/* keyed by period so "Show all" folds back up when another month is picked */}
              <PledgesExpensesTable key={periodLabel} entries={periodLedger} periodLabel={periodLabel} />
            </section>
          </div>

          {entryForm && (
            <LedgerFormModal
              form={entryForm}
              isEditing={false}
              saving={savingEntry}
              canSave={canSaveEntry}
              onChange={updateEntryForm}
              onSave={saveEntry}
              onClose={closeEntryForm}
              error={entryError}
            />
          )}
        </div>
      </main>
    </div>
  );
}
