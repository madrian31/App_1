import { Sidebar } from "../../components/sidebar/Sidebar";
import OfferingsTable from "../../components/offerings/OfferingsTable";
import { fmtPeso } from "../../components/finance/financeFormat";
import useOfferings from "../../hooks/useOfferings";
import "../Finance/finance.css";
import "./offerings.css";

// TODO: replace with the actual logged-in user's name/role once auth/session
// wiring is in place — mirrors the TODO already in Tithes.tsx.
const CURRENT_USER = "Unknown";
const CAN_MANAGE = true; // TODO: derive from role (Admin/Moderator) once available

export default function Offerings() {
  const {
    monthLabel,
    stepMonth,
    goToCurrentMonth,
    isCurrentMonth,
    canStepForward,
    days,
    entries,
    rowStatus,
    loading,
    error,
    handleAmountChange,
    flushSave,
    total,
    sundayTotal,
    wednesdayTotal,
    recordedCount,
    pastServiceCount,
    averagePerService,
  } = useOfferings(CURRENT_USER);

  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Offerings</h1>
              <p>Enter the total offering for each Wednesday and Sunday service — changes save automatically.</p>
            </div>
          </div>

          <div className="finance-period">
            <div className="finance-period-stepper">
              <button type="button" onClick={() => stepMonth(-1)} aria-label="Previous month" title="Previous month">
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className="finance-period-label" aria-live="polite">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => stepMonth(1)}
                disabled={!canStepForward}
                aria-label="Next month"
                title="Next month"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
            {!isCurrentMonth && (
              <button type="button" className="finance-period-today" onClick={goToCurrentMonth}>
                Back to this month
              </button>
            )}
          </div>

          <div className="summary-cards offering-kpis">
            <div className="summary-card">
              <span className="summary-card-value" style={{ color: "var(--success)" }}>
                {v(total)}
              </span>
              <span className="summary-card-label">Total Offerings — {monthLabel}</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{v(sundayTotal)}</span>
              <span className="summary-card-label">
                <i className="fa-solid fa-church" aria-hidden="true" /> Sunday Services
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{v(wednesdayTotal)}</span>
              <span className="summary-card-label">
                <i className="fa-solid fa-book-bible" aria-hidden="true" /> Wednesday Services
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{v(averagePerService)}</span>
              <span className="summary-card-label">
                Average per service · {loading ? "…" : `${recordedCount} of ${pastServiceCount} recorded`}
              </span>
            </div>
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="members-card">
            <OfferingsTable
              days={days}
              entries={entries}
              rowStatus={rowStatus}
              loading={loading}
              canManage={CAN_MANAGE}
              monthLabel={monthLabel}
              total={total}
              onAmountChange={handleAmountChange}
              onBlur={flushSave}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
