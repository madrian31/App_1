import { MONTHS, MONTHS_SHORT } from "../../hooks/usePledgesReport";
import { compactPeso, fmtPeso } from "../finance/financeFormat";

interface PledgesMonthChartProps {
  year: number;
  monthTotals: number[]; // 12 entries, Jan..Dec
  selectedMonth: number | null;
  onSelectMonth: (month: number) => void;
}

/** What the pledgers gave per month for the whole year (donations not included) — same
 *  bar-column pattern as the Finance and Attendance reports. Clicking a month narrows the page to it. */
export default function PledgesMonthChart({ year, monthTotals, selectedMonth, onSelectMonth }: PledgesMonthChartProps) {
  const max = Math.max(...monthTotals, 0);

  return (
    <div className="members-card trend-card">
      <div className="trend-header">
        <i className="fa-solid fa-chart-column" aria-hidden="true" />
        <h3>From Pledgers per Month — {year}</h3>
        <span className="trend-hint">Click a month to see who gave</span>
      </div>

      <div className={`trend-chart${selectedMonth !== null ? " has-selection" : ""}`}>
        {monthTotals.map((total, m) => {
          const selected = m === selectedMonth;
          const pct = max > 0 ? (total / max) * 100 : 0;
          return (
            <button
              key={m}
              type="button"
              className={`trend-col${selected ? " trend-col--selected" : ""}`}
              aria-pressed={selected}
              title={`${MONTHS[m]} ${year}: ${fmtPeso(total)}`}
              onClick={() => onSelectMonth(m)}
            >
              <span className="finance-bar-value">{total > 0 ? compactPeso(total) : ""}</span>
              <div className="trend-bar-track">
                {pct > 0 && <div className="trend-bar" style={{ height: `${Math.max(pct, 6)}%` }} />}
              </div>
              <span className="trend-label">{MONTHS_SHORT[m]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
