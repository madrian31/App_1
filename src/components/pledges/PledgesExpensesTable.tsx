import { useState } from "react";
import { Link } from "react-router-dom";
import type { LedgerEntry, LedgerEntryType } from "../../types/ledger";
import { ledgerEntryText } from "../../types/ledger";
import { fmtPeso } from "../finance/financeFormat";
import { formatDisplayDate } from "../../utils/date";

const TYPE_CONFIG: Record<LedgerEntryType, { label: string; sign: string; className: string }> = {
  EXPENSE: { label: "Expense", sign: "−", className: "ledger-type-pill--expense" },
  LOAN_OUT: { label: "Loan Out", sign: "−", className: "ledger-type-pill--loan" },
  REPAYMENT: { label: "Repayment", sign: "+", className: "ledger-type-pill--repayment" },
  DONATION: { label: "Donation", sign: "+", className: "ledger-type-pill--donation" },
};

/** Rows shown before "Show all" — a whole year can run long. */
const PREVIEW_ROWS = 10;

interface PledgesExpensesTableProps {
  entries: LedgerEntry[]; // Pledges Ledger entries in the selected period
  periodLabel: string;
}

/** The pooled pledge money's other movements in the period — what was spent, and what came
 *  in from outside the pledgers. Newest first, latest few until "Show all"; the period's
 *  totals are on the cards above. Read-only; changes are made in the Ledger. */
export default function PledgesExpensesTable({ entries, periodLabel }: PledgesExpensesTableProps) {
  const [showAll, setShowAll] = useState(false);

  const newestFirst = [...entries].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  const visible = showAll ? newestFirst : newestFirst.slice(0, PREVIEW_ROWS);
  const hiddenCount = newestFirst.length - visible.length;

  return (
    <div className="members-card">
      <div className="pledge-breakdown-header">
        <h3>Expenses &amp; Donations — {periodLabel}</h3>
        <Link to="/ledger/pledges" className="pledge-ledger-link">
          Edit or delete in Pledges → Ledger
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        </Link>
      </div>

      <div className="table-scroll">
        <table className="members-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Description</th>
              <th className="col-hide-mobile">Category</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  No expenses or donations recorded in {periodLabel}.
                </td>
              </tr>
            ) : (
              visible.map((e) => {
                const cfg = TYPE_CONFIG[e.type];
                return (
                  <tr key={e.id}>
                    <td>
                      <span className="date-text">{formatDisplayDate(e.dateAdded)}</span>
                    </td>
                    <td>
                      <span className={`badge ledger-type-pill ${cfg.className}`}>{cfg.label}</span>
                    </td>
                    <td>{ledgerEntryText(e)}</td>
                    <td className="col-hide-mobile">
                      {e.category ? (
                        <span className="badge badge-category">{e.category}</span>
                      ) : (
                        <span className="date-text">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {cfg.sign} {fmtPeso(e.amount)}
                    </td>
                  </tr>
                );
              })
            )}
            {newestFirst.length > PREVIEW_ROWS && (
              <tr>
                <td colSpan={5} className="pledge-show-more-cell">
                  <button type="button" className="pledge-show-more" onClick={() => setShowAll((v) => !v)}>
                    {showAll ? (
                      <>
                        Show only the {PREVIEW_ROWS} most recent
                        <i className="fa-solid fa-chevron-up" aria-hidden="true" />
                      </>
                    ) : (
                      <>
                        Show all {newestFirst.length} entries ({hiddenCount} more)
                        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
