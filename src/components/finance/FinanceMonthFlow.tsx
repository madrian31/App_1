import { fmtPeso } from "./financeFormat";
import { getFinanceStatus } from "./financeStatus";

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
}

/**
 * The period's financial status, designed answer-first for every reader (including
 * older church members): a plain verdict with the money left on the left, and on the
 * right an income-vs-expenses comparison plus a short receipt showing how we got there.
 * The verdict wording lives in financeStatus.ts, shared with the PDF.
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
}: FinanceMonthFlowProps) {
  const periodIncome = periodTithes + periodOfferings;
  // Department lines only appear in periods where departments were given or returned budget.
  const withDepartments = periodDeptGiven > 0 || periodDeptReturned > 0;
  const periodOut = periodExpenses + periodDeptGiven - periodDeptReturned;
  const outLabel = withDepartments ? "expenses and department funds" : "expenses";
  const hasActivity = periodIncome > 0 || periodExpenses > 0 || withDepartments;

  // Every line names its period, so "tithes received" is never ambiguous.
  const inPeriod = periodLabel.includes("–") ? `(${periodLabel})` : `in ${periodLabel}`;

  const m = getFinanceStatus(periodIncome, periodOut, endBalance, inPeriod, fmtPeso, outLabel);
  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  // Both bars share one scale so their lengths can be compared directly.
  const scale = Math.max(periodIncome, periodOut, 1);
  const barPct = (n: number) => (n > 0 ? Math.max((n / scale) * 100, 2) : 0);

  return (
    <section className={`members-card finance-status is-${m.kind}`} aria-label={`Financial status — ${periodLabel}`}>
      {/* ── The answer ── */}
      <div className="finance-status-verdict">
        <span className="finance-status-eyebrow">Financial Status · {periodLabel}</span>
        {loading ? (
          <p className="finance-status-headline">Loading…</p>
        ) : (
          <>
            <p className="finance-status-headline">
              <i className={`fa-solid ${m.icon}`} aria-hidden="true" />
              {m.headline}
            </p>
            <p className="finance-status-detail">{m.detail}</p>
            {m.figure && (
              <div className="finance-status-figure">
                <span className="finance-status-figure-value">{m.figure.value}</span>
                <span className="finance-status-figure-label">{m.figure.label}</span>
              </div>
            )}
          </>
        )}

        <div className="finance-status-left">
          <span className="finance-status-left-label">Remaining Balance</span>
          <span className="finance-status-left-value">{v(endBalance)}</span>
        </div>
      </div>

      {/* ── How we got there ── */}
      <div className="finance-status-breakdown">
        <h4 className="finance-status-subtitle">How we got here — {periodLabel}</h4>

        {hasActivity || loading ? (
          <div
            className="finance-compare"
            role="img"
            aria-label={`Tithes and offerings ${v(periodIncome)}, ${outLabel} ${v(periodOut)} ${inPeriod}`}
          >
            <div className="finance-compare-row">
              <span className="finance-compare-label">Tithes &amp; Offerings</span>
              <div className="finance-compare-track">
                <div className="finance-compare-bar is-in" style={{ width: `${barPct(periodIncome)}%` }} />
              </div>
              <span className="finance-compare-value">{v(periodIncome)}</span>
            </div>
            <div className="finance-compare-row">
              <span className="finance-compare-label">
                {withDepartments ? "Expenses & Department Funds" : "Expenses"}
              </span>
              <div className="finance-compare-track">
                <div className="finance-compare-bar is-out" style={{ width: `${barPct(periodOut)}%` }} />
              </div>
              <span className="finance-compare-value">{v(periodOut)}</span>
            </div>
          </div>
        ) : (
          <p className="finance-compare-empty">
            <i className="fa-regular fa-folder-open" aria-hidden="true" /> Nothing to compare — no tithes, offerings or
            expenses {inPeriod}.
          </p>
        )}

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
      </div>
    </section>
  );
}
