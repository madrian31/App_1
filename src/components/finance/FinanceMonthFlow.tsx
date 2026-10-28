import { Link } from "react-router-dom";
import { fmtPeso } from "./financeFormat";

interface FinanceMonthFlowProps {
  loading: boolean;
  periodLabel: string;
  startBalance: number; // carried over from before the period
  periodTithes: number;
  periodOfferings: number;
  periodExpenses: number;
  periodDeptGiven: number; // budget given to departments in the period
  periodDeptReturned: number; // unused budget departments returned in the period
  endBalance: number;
  changePct: number | null; // tithes & offerings vs the period of the same length right before
  ytdIncome: number;
  ytdYear: number;
}

/**
 * Step by step from the previous balance to the remaining balance, like a receipt —
 * the detail behind the summary card at the top of the report.
 */
export default function FinanceMonthFlow({
  loading,
  periodLabel,
  startBalance,
  periodTithes,
  periodOfferings,
  periodExpenses,
  periodDeptGiven,
  periodDeptReturned,
  endBalance,
  changePct,
  ytdIncome,
  ytdYear,
}: FinanceMonthFlowProps) {
  // Every line names its period, so "tithes received" is never ambiguous.
  const inPeriod = periodLabel.includes("–") ? `(${periodLabel})` : `in ${periodLabel}`;
  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  return (
    <div className="members-card finance-breakdown">
      <dl className="finance-receipt">
        <div>
          <dt>Previous Balance</dt>
          <dd>{v(startBalance)}</dd>
        </div>
        <div>
          <dt>Plus tithes received {inPeriod}</dt>
          <dd className="finance-up">+ {v(periodTithes)}</dd>
        </div>
        <div>
          <dt>Plus offerings received {inPeriod}</dt>
          <dd className="finance-up">+ {v(periodOfferings)}</dd>
        </div>
        <div>
          <dt>Minus expenses {inPeriod}</dt>
          <dd className="finance-down">− {v(periodExpenses)}</dd>
        </div>
        {periodDeptGiven > 0 && (
          <div>
            <dt>Minus budget given to departments {inPeriod}</dt>
            <dd className="finance-down">− {v(periodDeptGiven)}</dd>
          </div>
        )}
        {periodDeptReturned > 0 && (
          <div>
            <dt>Plus unused budget returned by departments {inPeriod}</dt>
            <dd className="finance-up">+ {v(periodDeptReturned)}</dd>
          </div>
        )}
        <div className="finance-receipt-total">
          <dt>Remaining Balance</dt>
          <dd>{v(endBalance)}</dd>
        </div>
      </dl>

      <dl className="finance-receipt finance-receipt-extra">
        <div>
          <dt>Tithes &amp; offerings compared with the previous period</dt>
          {loading ? (
            <dd>…</dd>
          ) : changePct === null ? (
            <dd className="finance-receipt-muted">No records in the previous period</dd>
          ) : (
            <dd className={changePct >= 0 ? "finance-up" : "finance-down"}>
              {changePct >= 0 ? "+" : ""}
              {changePct.toFixed(1)}%
            </dd>
          )}
        </div>
        <div>
          <dt>Tithes &amp; offerings so far in {ytdYear}</dt>
          <dd>{v(ytdIncome)}</dd>
        </div>
      </dl>

      <p className="finance-table-note">
        Each bill is listed on the <Link to="/Finance/Expenses">Expenses</Link> page. Budgets given to departments are
        on the <Link to="/Finance/DepartmentFunds">Department Funds</Link> page.
      </p>
    </div>
  );
}
