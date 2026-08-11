import { Sidebar } from "../../components/sidebar/Sidebar";
import usePledgesReport, { MONTHS, type QuickRange } from "../../hooks/usePledgesReport";
import "./pledgesMembers.css";

const QUICK_RANGES: { value: QuickRange; label: string }[] = [
  { value: "thisMonth", label: "This Month" },
  { value: "last3Months", label: "Last 3 Months" },
  { value: "thisYear", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

function fmt(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PledgesReport() {
  const {
    quickRange,
    onQuickRangeChange,
    fromMonth,
    setFromMonth,
    fromYear,
    setFromYear,
    toMonth,
    setToMonth,
    toYear,
    setToYear,
    years,
    loading,
    error,
    grandTotal,
    activePledgers,
    avgPerPledger,
    byMonth,
    byMember,
    exportCSV,
  } = usePledgesReport();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Pledges Report</h1>
              <p>
                {MONTHS[fromMonth]} {fromYear} – {MONTHS[toMonth]} {toYear}
              </p>
            </div>
            <div className="page-header-actions">
              <button className="btn-secondary" onClick={exportCSV} disabled={loading}>
                <i className="fa-solid fa-file-export" aria-hidden="true" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Range picker */}
          <div className="toolbar-row report-range-row">
            <div className="quick-range-group">
              {QUICK_RANGES.map((r) => (
                <button
                  key={r.value}
                  className={`quick-range-btn${quickRange === r.value ? " active" : ""}`}
                  onClick={() => onQuickRangeChange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="month-range-wrap">
              <div className="filter-select-wrap">
                <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-select-wrap">
                <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <span className="month-range-arrow">→</span>

              <div className="filter-select-wrap">
                <select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-select-wrap">
                <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))}>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          {/* KPIs */}
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-card-value">{loading ? "…" : fmt(grandTotal)}</span>
              <span className="summary-card-label">Total Collected</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{loading ? "…" : activePledgers}</span>
              <span className="summary-card-label">Active Pledgers</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{loading ? "…" : fmt(avgPerPledger)}</span>
              <span className="summary-card-label">Avg per Pledger</span>
            </div>
          </div>

          {/* Breakdown by Month */}
          <section className="report-section">
            <h2 className="report-section-title">Monthly Breakdown</h2>
            <div className="members-card">
              <div className="table-scroll">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Total Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={2} className="empty-cell">
                          <div className="empty-state">
                            <p>Loading…</p>
                          </div>
                        </td>
                      </tr>
                    ) : byMonth.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="table-empty">
                          No pledges recorded for this range.
                        </td>
                      </tr>
                    ) : (
                      byMonth.map((row) => (
                        <tr key={row.key}>
                          <td>{row.label}</td>
                          <td>{fmt(row.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Breakdown by Member */}
          <section className="report-section">
            <h2 className="report-section-title">Member Breakdown</h2>
            <div className="members-card">
              <div className="table-scroll">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Total</th>
                      <th>Sundays Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="empty-cell">
                          <div className="empty-state">
                            <p>Loading…</p>
                          </div>
                        </td>
                      </tr>
                    ) : byMember.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="table-empty">
                          No pledges recorded for this range.
                        </td>
                      </tr>
                    ) : (
                      byMember.map((row) => (
                        <tr key={row.memberId}>
                          <td>
                            <span className="member-name">{row.memberName}</span>
                          </td>
                          <td>{fmt(row.total)}</td>
                          <td>{row.sundaysPaid}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
