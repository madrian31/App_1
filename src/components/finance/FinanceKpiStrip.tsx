import { Link } from "react-router-dom";
import { fmtPeso } from "./financeFormat";

interface FinanceKpiStripProps {
  loading: boolean;
  fundBalance: number;
  startingBalanceSet: boolean; // shows a "set it in Settings" prompt until it has been saved
  periodLabel: string; // "October 2026", "Aug – Oct 2026"…
  periodTithes: number;
  periodOfferings: number;
  periodIncome: number; // tithes + offerings
  changePct: number | null; // income vs the period of the same length right before
  ytdIncome: number;
  ytdYear: number;
  periodExpenses: number;
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
  startingBalanceSet,
  periodLabel,
  periodTithes,
  periodOfferings,
  periodIncome,
  changePct,
  ytdIncome,
  ytdYear,
  periodExpenses,
}: FinanceKpiStripProps) {
  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  return (
    <div className="summary-cards finance-kpis">
      <div className="summary-card finance-kpi-hero">
        <span className="summary-card-label">General Fund Balance</span>
        <span className="summary-card-value">{v(fundBalance)}</span>
        <span className="finance-kpi-sub">All the money the church has today</span>
        {!loading && !startingBalanceSet && (
          <Link to="/settings" className="finance-link-btn finance-kpi-setup">
            <i className="fa-solid fa-gear" aria-hidden="true" /> Set starting balance in Settings
          </Link>
        )}
      </div>

      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--success)" }}>
          {v(periodIncome)}
        </span>
        <span className="summary-card-label">Tithes &amp; Offerings — {periodLabel}</span>
        {!loading && (
          <span className="finance-kpi-sub">
            Tithes {fmtPeso(periodTithes)} · Offerings {fmtPeso(periodOfferings)}
          </span>
        )}
        {!loading && <ChangeBadge pct={changePct} />}
      </div>

      <div className="summary-card">
        <span className="summary-card-value">{v(ytdIncome)}</span>
        <span className="summary-card-label">Tithes &amp; Offerings — {ytdYear} year to date</span>
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
