import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "./financeFormat";

interface FinanceMonthFlowProps {
  loading: boolean;
  periodLabel: string;
  dateFrom: string; // ISO — first day of the period
  dateTo: string; // ISO — last day of the period
  startBalance: number; // carried over from before the period
  periodTithes: number;
  periodExpenses: number;
  endBalance: number;
}

type FlowStatus = "empty" | "surplus" | "covered" | "deficit";

/**
 * The period's financial status, designed answer-first for every reader (including
 * older church members): a plain verdict with the money left on the left, and on the
 * right a tithes-vs-expenses comparison plus a short receipt showing how we got there.
 * A period whose tithes fall short is only a real deficit if the fund can't cover it.
 */
export default function FinanceMonthFlow({
  loading,
  periodLabel,
  dateFrom,
  dateTo,
  startBalance,
  periodTithes,
  periodExpenses,
  endBalance,
}: FinanceMonthFlowProps) {
  const periodNet = periodTithes - periodExpenses;
  const hasActivity = periodTithes > 0 || periodExpenses > 0;
  const status: FlowStatus = !hasActivity
    ? "empty"
    : endBalance < 0
      ? "deficit"
      : periodNet < 0
        ? "covered"
        : "surplus";

  // Every line names its period, so "tithes received" is never ambiguous.
  const inPeriod = periodLabel.includes("–") ? `(${periodLabel})` : `in ${periodLabel}`;
  const startLabel = formatDisplayDate(dateFrom);
  const endLabel = formatDisplayDate(dateTo);

  const verdict: Record<FlowStatus, { icon: string; headline: string; detail: string }> = {
    empty: {
      icon: "fa-circle-minus",
      headline: "No records yet",
      detail: `No tithes or expenses were recorded ${inPeriod}.`,
    },
    surplus: {
      icon: "fa-face-smile",
      headline: "We're doing well",
      detail:
        periodNet > 0
          ? `Tithes covered all the expenses, with ${fmtPeso(periodNet)} left over to save.`
          : "Tithes exactly covered the expenses — nothing was taken from our savings.",
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
          <span className="finance-status-left-label">Money left as of {endLabel}</span>
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
            aria-label={`Tithes ${v(periodTithes)}, expenses ${v(periodExpenses)} ${inPeriod}`}
          >
            <div className="finance-compare-row">
              <span className="finance-compare-label">Tithes</span>
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
        ) : (
          <p className="finance-compare-empty">
            <i className="fa-regular fa-folder-open" aria-hidden="true" /> Nothing to compare — no tithes or expenses{" "}
            {inPeriod}.
          </p>
        )}

        <dl className="finance-receipt">
          <div>
            <dt>Money we had before {startLabel}</dt>
            <dd>{v(startBalance)}</dd>
          </div>
          <div>
            <dt>Plus tithes received {inPeriod}</dt>
            <dd className="finance-up">+ {v(periodTithes)}</dd>
          </div>
          <div>
            <dt>Minus expenses {inPeriod}</dt>
            <dd className="finance-down">− {v(periodExpenses)}</dd>
          </div>
          <div className="finance-receipt-total">
            <dt>Money left as of {endLabel}</dt>
            <dd>{v(endBalance)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
