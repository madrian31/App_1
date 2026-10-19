import { fmtPeso } from "./financeFormat";

interface FinanceMonthFlowProps {
  loading: boolean;
  monthLabel: string;
  startBalance: number; // carried over from previous months
  monthTithes: number;
  monthExpenses: number;
  endBalance: number;
}

type FlowStatus = "surplus" | "covered" | "deficit";

/**
 * The month's financial status, read with what previous months left over:
 * a month whose tithes fall short is only a real deficit if the fund can't cover it.
 */
export default function FinanceMonthFlow({
  loading,
  monthLabel,
  startBalance,
  monthTithes,
  monthExpenses,
  endBalance,
}: FinanceMonthFlowProps) {
  const monthNet = monthTithes - monthExpenses;
  const status: FlowStatus = endBalance < 0 ? "deficit" : monthNet < 0 ? "covered" : "surplus";

  const message: Record<FlowStatus, { icon: string; title: string; detail: string }> = {
    surplus: {
      icon: "fa-circle-check",
      title: "Surplus",
      detail: `Tithes covered this month's expenses — ${fmtPeso(monthNet)} added to the fund.`,
    },
    covered: {
      icon: "fa-triangle-exclamation",
      title: "Covered by savings",
      detail: `Tithes were ${fmtPeso(-monthNet)} short this month, covered by what previous months left over.`,
    },
    deficit: {
      icon: "fa-circle-xmark",
      title: "Deficit",
      detail: `Even with previous months' savings, the fund is short by ${fmtPeso(-endBalance)}.`,
    },
  };
  const m = message[status];
  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  return (
    <div className={`members-card finance-flow is-${status}`}>
      <div className="finance-flow-header">
        <h3>Financial Status — {monthLabel}</h3>
        {!loading && (
          <span className="finance-flow-badge">
            <i className={`fa-solid ${m.icon}`} aria-hidden="true" /> {m.title}
          </span>
        )}
      </div>

      <div className="finance-flow-steps">
        <div className="finance-flow-step">
          <span className="finance-flow-label">Carried over from previous months</span>
          <span className="finance-flow-value">{v(startBalance)}</span>
        </div>
        <span className="finance-flow-op" aria-hidden="true">+</span>
        <div className="finance-flow-step">
          <span className="finance-flow-label">Tithes this month</span>
          <span className="finance-flow-value finance-up">{v(monthTithes)}</span>
        </div>
        <span className="finance-flow-op" aria-hidden="true">−</span>
        <div className="finance-flow-step">
          <span className="finance-flow-label">Expenses this month</span>
          <span className="finance-flow-value finance-down">{v(monthExpenses)}</span>
        </div>
        <span className="finance-flow-op" aria-hidden="true">=</span>
        <div className="finance-flow-step finance-flow-result">
          <span className="finance-flow-label">Left at end of month</span>
          <span className="finance-flow-value">{v(endBalance)}</span>
        </div>
      </div>

      {!loading && <p className="finance-flow-detail">{m.detail}</p>}
    </div>
  );
}
