import { fmtPeso } from "./financeFormat";

interface FinanceMonthFlowProps {
  loading: boolean;
  periodLabel: string;
  startBalance: number; // carried over from before the period
  periodTithes: number;
  periodExpenses: number;
  endBalance: number;
}

type FlowStatus = "surplus" | "covered" | "deficit";

/**
 * The period's financial status, designed answer-first for every reader (including
 * older church members): a plain verdict with the money left on the left, and on the
 * right a tithes-vs-expenses comparison plus a short receipt showing how we got there.
 * A period whose tithes fall short is only a real deficit if the fund can't cover it.
 */
export default function FinanceMonthFlow({
  loading,
  periodLabel,
  startBalance,
  periodTithes,
  periodExpenses,
  endBalance,
}: FinanceMonthFlowProps) {
  const periodNet = periodTithes - periodExpenses;
  const status: FlowStatus = endBalance < 0 ? "deficit" : periodNet < 0 ? "covered" : "surplus";

  const verdict: Record<FlowStatus, { icon: string; headline: string; detail: string }> = {
    surplus: {
      icon: "fa-face-smile",
      headline: "We're doing well",
      detail: `Tithes covered all the expenses, with ${fmtPeso(periodNet)} left over to save.`,
    },
    covered: {
      icon: "fa-circle-check",
      headline: "We're okay",
      detail: `Expenses were ${fmtPeso(-periodNet)} more than the tithes, so we used some of our savings. We still have enough.`,
    },
    deficit: {
      icon: "fa-triangle-exclamation",
      headline: "We need more funds",
      detail: `Even after using our savings, we are short by ${fmtPeso(-endBalance)}.`,
    },
  };
  const m = verdict[status];
  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  // Both bars share one scale so their lengths can be compared directly.
  const scale = Math.max(periodTithes, periodExpenses, 1);
  const barPct = (n: number) => (n > 0 ? Math.max((n / scale) * 100, 2) : 0);

  return (
    <section className={`members-card finance-status is-${status}`} aria-label={`Financial status — ${periodLabel}`}>
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
          </>
        )}

        <div className="finance-status-left">
          <span className="finance-status-left-label">Money left</span>
          <span className="finance-status-left-value">{v(endBalance)}</span>
        </div>
      </div>

      {/* ── How we got there ── */}
      <div className="finance-status-breakdown">
        <h4 className="finance-status-subtitle">How we got here</h4>

        <div className="finance-compare" role="img" aria-label={`Tithes ${v(periodTithes)}, expenses ${v(periodExpenses)}`}>
          <div className="finance-compare-row">
            <span className="finance-compare-label">Tithes received</span>
            <div className="finance-compare-track">
              <div className="finance-compare-bar is-in" style={{ width: `${barPct(periodTithes)}%` }} />
            </div>
            <span className="finance-compare-value">{v(periodTithes)}</span>
          </div>
          <div className="finance-compare-row">
            <span className="finance-compare-label">Expenses</span>
            <div className="finance-compare-track">
              <div className="finance-compare-bar is-out" style={{ width: `${barPct(periodExpenses)}%` }} />
            </div>
            <span className="finance-compare-value">{v(periodExpenses)}</span>
          </div>
        </div>

        <dl className="finance-receipt">
          <div>
            <dt>Money we had before</dt>
            <dd>{v(startBalance)}</dd>
          </div>
          <div>
            <dt>Plus tithes received</dt>
            <dd className="finance-up">+ {v(periodTithes)}</dd>
          </div>
          <div>
            <dt>Minus expenses</dt>
            <dd className="finance-down">− {v(periodExpenses)}</dd>
          </div>
          <div className="finance-receipt-total">
            <dt>Money left</dt>
            <dd>{v(endBalance)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
