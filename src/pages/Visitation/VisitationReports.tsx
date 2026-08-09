import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useVisitationReports from "../../hooks/useVisitationReports";
import type { QuickRange } from "../../hooks/useVisitation";
import "./visitation.css";

const QUICK_RANGES: { value: QuickRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

/** Formats an ISO date string (YYYY-MM-DD) as "Aug 9, 2026". */
function formatDisplayDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VisitationReports() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    quickRange,
    onQuickRangeChange,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    totalVisits,
    membersVisited,
    departmentsCount,
    byDepartment,
    byPurpose,
    memberHistory,
  } = useVisitationReports();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Visitation Reports</h1>
              <p>Sino ang binisita, gaano karami, kailan, at aling department ang gumawa.</p>
            </div>
            <div className="page-header-actions">
              <button className="btn-secondary" onClick={() => navigate("/Visitation")}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                Back to Visitation
              </button>
            </div>
          </div>

          {/* Date Range */}
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

            {quickRange === "custom" && (
              <div className="date-range-wrap">
                <input
                  type="date"
                  className="date-input"
                  value={dateFrom}
                  max={dateTo}
                  onChange={(e) => onDateFromChange(e.target.value)}
                />
                <span className="date-range-arrow">→</span>
                <input
                  type="date"
                  className="date-input"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => onDateToChange(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          {/* 1. Summary */}
          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-card-value">{loading ? "…" : totalVisits}</span>
              <span className="summary-card-label">Total Visits</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{loading ? "…" : membersVisited}</span>
              <span className="summary-card-label">Members Visited</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{loading ? "…" : departmentsCount}</span>
              <span className="summary-card-label">Departments</span>
            </div>
          </div>

          {/* 2. Visits by Department */}
          <section className="report-section">
            <h2 className="report-section-title">Visits by Department</h2>
            <div className="members-card">
              <div className="table-scroll">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Visits</th>
                      <th>Members Visited</th>
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
                    ) : byDepartment.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="table-empty">
                          No visits recorded for this range.
                        </td>
                      </tr>
                    ) : (
                      byDepartment.map((row) => (
                        <tr key={row.department}>
                          <td>
                            <span className="badge badge-category">{row.department}</span>
                          </td>
                          <td>{row.visits}</td>
                          <td>{row.membersVisited}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 3. Visits by Purpose */}
          <section className="report-section">
            <h2 className="report-section-title">Visits by Purpose</h2>
            <div className="members-card">
              <div className="table-scroll">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Purpose</th>
                      <th>Visits</th>
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
                    ) : byPurpose.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="table-empty">
                          No visits recorded for this range.
                        </td>
                      </tr>
                    ) : (
                      byPurpose.map((row) => (
                        <tr key={row.purpose}>
                          <td>{row.purpose}</td>
                          <td>{row.visits}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 4. Member Visitation History */}
          <section className="report-section">
            <h2 className="report-section-title">Member Visitation History</h2>
            <div className="members-card">
              <div className="table-scroll">
                <table className="members-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Last Visit</th>
                      <th>Total Visits</th>
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
                    ) : memberHistory.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="table-empty">
                          No visits recorded for this range.
                        </td>
                      </tr>
                    ) : (
                      memberHistory.map((row) => (
                        <tr key={row.memberId}>
                          <td>
                            <span className="member-name">{row.memberName}</span>
                          </td>
                          <td>
                            <span className="date-text">{formatDisplayDate(row.lastVisit)}</span>
                          </td>
                          <td>{row.totalVisits}</td>
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
