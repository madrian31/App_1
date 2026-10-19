import type { FinanceMonthRow } from "../../hooks/useFinanceReport";
import { fmtPeso } from "./financeFormat";

interface FinanceTrendChartProps {
  months: FinanceMonthRow[];
  title: string; // e.g. "2026" or "Aug – Oct 2026"
  selectedKey: string | null; // month currently shown on its own, if any
  onSelectMonth: (year: number, month: number) => void;
}

/** Monthly tithes — same bar-column pattern as the Attendance Report trend. */
export default function FinanceTrendChart({ months, title, selectedKey, onSelectMonth }: FinanceTrendChartProps) {
  const max = Math.max(...months.map((m) => m.tithes), 0);

  return (
    <div className="members-card trend-card">
      <div className="trend-header">
        <i className="fa-solid fa-chart-column" aria-hidden="true" />
        <h3>Tithes per Month — {title}</h3>
        <span className="trend-hint">Click a month to view just that month</span>
      </div>

      <div className="trend-chart">
        {months.map((m) => {
          const selected = m.key === selectedKey;
          const pct = max > 0 ? (m.tithes / max) * 100 : 0;
          return (
            <button
              key={m.key}
              type="button"
              className={`trend-col${selected ? " trend-col--selected" : ""}`}
              aria-pressed={selected}
              title={`${m.label}${m.label.includes(String(m.year)) ? "" : ` ${m.year}`}: ${fmtPeso(m.tithes)}`}
              onClick={() => onSelectMonth(m.year, m.month)}
            >
              <span className="finance-bar-value">{m.tithes > 0 ? compactPeso(m.tithes) : ""}</span>
              <div className="trend-bar-track">
                {pct > 0 && <div className="trend-bar" style={{ height: `${Math.max(pct, 6)}%` }} />}
              </div>
              <span className="trend-label">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "₱12.5k" — short enough to sit above a bar. */
function compactPeso(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₱${(n / 1_000).toFixed(1)}k`;
  return `₱${Math.round(n)}`;
}
