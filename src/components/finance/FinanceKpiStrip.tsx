import { Link } from "react-router-dom";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "./financeFormat";

interface FinanceKpiStripProps {
  loading: boolean;
  fundBalance: number;
  openingBalance: number;
  openingDate: string;
  openingSet: boolean; // hides the "Set Balance" button once a balance has been saved
  periodLabel: string; // "October 2026", "Aug – Oct 2026"…
  periodTithes: number;
  changePct: number | null; // vs the period of the same length right before
  ytdTithes: number;
  ytdYear: number;
  periodExpenses: number;
  onEditOpening: () => void;
}

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="finance-kpi-sub">No data in the previous period</span>;
  const up = pct >= 0;
  return (
    <span className={`finance-kpi-sub ${up ? "finance-up" : "finance-down"}`}>
      <i className={`fa-solid ${up ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`} aria-hidden="true" />{" "}
      {up ? "+" : ""}
      {pct.toFixed(1)}% vs previous period
    </span>
  );
}

export default function FinanceKpiStrip({
  loading,
  fundBalance,
  openingBalance,
  openingDate,
  openingSet,
  periodLabel,
  periodTithes,
  changePct,
  ytdTithes,
  ytdYear,
  periodExpenses,
  onEditOpening,
}: FinanceKpiStripProps) {
  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  return (
    <div className="summary-cards finance-kpis">
      <div className="summary-card finance-kpi-hero">
        <span className="summary-card-label">General Fund Balance</span>
        <span className="summary-card-value">{v(fundBalance)}</span>
        <span className="finance-kpi-sub">
          Opening {fmtPeso(openingBalance)}
          {openingDate ? ` as of ${formatDisplayDate(openingDate)}` : ""} + tithes − expenses
          {!loading && !openingSet && (
            <button type="button" className="finance-link-btn" onClick={onEditOpening}>
              <i className="fa-regular fa-pen-to-square" aria-hidden="true" /> Set Balance
            </button>
          )}
        </span>
      </div>

      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--success)" }}>
          {v(periodTithes)}
        </span>
        <span className="summary-card-label">Tithes — {periodLabel}</span>
        {!loading && <ChangeBadge pct={changePct} />}
      </div>

      <div className="summary-card">
        <span className="summary-card-value">{v(ytdTithes)}</span>
        <span className="summary-card-label">Tithes — {ytdYear} year to date</span>
      </div>

      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--danger)" }}>
          {v(periodExpenses)}
        </span>
        <span className="summary-card-label">Expenses — {periodLabel}</span>
        <Link to="/Finance/Expenses" className="finance-kpi-sub finance-kpi-link">
          View / add expenses →
        </Link>
      </div>
    </div>
  );
}
