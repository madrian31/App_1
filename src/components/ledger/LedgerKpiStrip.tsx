import type { LedgerTotals } from "../../types/ledger";

function fmt(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface LedgerKpiStripProps extends LedgerTotals {
  entryCount: number;
}

export default function LedgerKpiStrip({
  totalExpenses,
  totalLoanOut,
  totalRepayment,
  netOutflow,
  entryCount,
}: LedgerKpiStripProps) {
  return (
    <div className="summary-cards">
      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--danger)" }}>
          {fmt(totalExpenses)}
        </span>
        <span className="summary-card-label">Expenses</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "#b45309" }}>
          {fmt(totalLoanOut)}
        </span>
        <span className="summary-card-label">Loan Out</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--success)" }}>
          {fmt(totalRepayment)}
        </span>
        <span className="summary-card-label">Repayments</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value" style={{ color: netOutflow > 0 ? "var(--danger)" : "var(--success)" }}>
          {fmt(netOutflow)}
        </span>
        <span className="summary-card-label">Net Outflow</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value">{entryCount}</span>
        <span className="summary-card-label">Entries</span>
      </div>
    </div>
  );
}
