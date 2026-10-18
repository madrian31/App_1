import { Link } from "react-router-dom";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "./financeFormat";

interface FinanceKpiStripProps {
  loading: boolean;
  fundBalance: number;
  openingBalance: number;
  openingDate: string;
  monthLabel: string; // "October 2026"
  monthTithes: number;
  monthChangePct: number | null;
  ytdTithes: number;
  monthExpenses: number;
  onEditOpening: () => void;
}

function ChangeBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="finance-kpi-sub">No data last month</span>;
  const up = pct >= 0;
  return (
    <span className={`finance-kpi-sub ${up ? "finance-up" : "finance-down"}`}>
      <i className={`fa-solid ${up ? "fa-arrow-trend-up" : "fa-arrow-trend-down"}`} aria-hidden="true" />{" "}
      {up ? "+" : ""}
      {pct.toFixed(1)}% vs last month
    </span>
  );
}

export default function FinanceKpiStrip({
  loading,
  fundBalance,
  openingBalance,
  openingDate,
  monthLabel,
  monthTithes,
  monthChangePct,
  ytdTithes,
  monthExpenses,
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
          <button type="button" className="finance-link-btn" onClick={onEditOpening}>
            <i className="fa-regular fa-pen-to-square" aria-hidden="true" /> Opening balance
          </button>
        </span>
      </div>

      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--success)" }}>
          {v(monthTithes)}
        </span>
        <span className="summary-card-label">Tithes — {monthLabel}</span>
        {!loading && <ChangeBadge pct={monthChangePct} />}
      </div>

      <div className="summary-card">
        <span className="summary-card-value">{v(ytdTithes)}</span>
        <span className="summary-card-label">Tithes — Year to date</span>
      </div>

      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--danger)" }}>
          {v(monthExpenses)}
        </span>
        <span className="summary-card-label">Expenses — {monthLabel}</span>
        <Link to="/Finance/Expenses" className="finance-kpi-sub finance-kpi-link">
          View / add expenses →
        </Link>
      </div>
    </div>
  );
}
