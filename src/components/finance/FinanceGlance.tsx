import { Link } from "react-router-dom";
import type { FinanceUpcoming } from "../../hooks/useFinanceReport";
import { fmtPeso } from "./financeFormat";
import { getFinanceStatus } from "./financeStatus";

interface FinanceGlanceProps {
  loading: boolean;
  periodLabel: string;
  currentPeriod: boolean; // the period includes today
  endBalance: number; // fund at the end of the period
  fundBalance: number; // fund today
  startingBalanceSet: boolean; // shows a "set it in Settings" prompt until it has been saved
  periodTithes: number;
  periodOfferings: number;
  periodExpenses: number;
  periodDeptGiven: number;
  periodDeptReturned: number;
  upcoming: FinanceUpcoming;
  showUpcoming: boolean;
  onToggleUpcoming: () => void;
}

/**
 * The whole report in one card, so it can be understood at a glance (including by older
 * church members): how much the fund has, whether it went up or down, money in vs money
 * out, and what still needs to be prepared for coming activities. Every other number is
 * under "Show full details".
 */
export default function FinanceGlance({
  loading,
  periodLabel,
  currentPeriod,
  endBalance,
  fundBalance,
  startingBalanceSet,
  periodTithes,
  periodOfferings,
  periodExpenses,
  periodDeptGiven,
  periodDeptReturned,
  upcoming,
  showUpcoming,
  onToggleUpcoming,
}: FinanceGlanceProps) {
  const periodIncome = periodTithes + periodOfferings;
  // Department funds only join "money out" in periods where departments were given or returned budget.
  const withDepartments = periodDeptGiven > 0 || periodDeptReturned > 0;
  const periodOut = periodExpenses + periodDeptGiven - periodDeptReturned;
  const outLabel = withDepartments ? "expenses and department funds" : "expenses";
  const inPeriod = periodLabel.includes("–") ? `(${periodLabel})` : `in ${periodLabel}`;

  const m = getFinanceStatus(periodIncome, periodOut, endBalance, inPeriod, fmtPeso, outLabel);
  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  // Both bars share one scale so their lengths can be compared directly.
  const scale = Math.max(periodIncome, periodOut, 1);
  const barPct = (n: number) => (n > 0 ? Math.max((n / scale) * 100, 2) : 0);

  return (
    <div className={`members-card finance-glance is-${m.kind}`} aria-label={`Finance summary — ${periodLabel}`}>
      <div className="finance-glance-top">
        <div className="finance-glance-balance">
          <span className="finance-glance-label">
            {currentPeriod ? "General Fund Balance" : `General Fund Balance — end of ${periodLabel}`}
          </span>
          <span className="finance-glance-value">{v(endBalance)}</span>
          {!loading && !currentPeriod && endBalance !== fundBalance && (
            <span className="finance-glance-sub">Today: {fmtPeso(fundBalance)}</span>
          )}
          {!loading && !startingBalanceSet && (
            <Link to="/settings" className="finance-glance-setup">
              <i className="fa-solid fa-gear" aria-hidden="true" /> Set starting balance in Settings
            </Link>
          )}
        </div>

        {!loading && (
          <div className="finance-glance-verdict">
            <span className="finance-glance-pill">
              <i className={`fa-solid ${m.icon}`} aria-hidden="true" />
              {m.headline}
            </span>
            {m.figure ? (
              <span className="finance-glance-change">
                <strong>{m.figure.value}</strong> {m.figure.label}
              </span>
            ) : (
              <span className="finance-glance-change">{m.detail}</span>
            )}
          </div>
        )}
      </div>

      {m.kind !== "empty" || loading ? (
        <div
          className="finance-compare"
          role="img"
          aria-label={`Money in ${v(periodIncome)}, money out ${v(periodOut)} ${inPeriod}`}
        >
          <div className="finance-compare-row">
            <span className="finance-compare-label">
              Money In
              <small>Tithes &amp; offerings</small>
            </span>
            <div className="finance-compare-track">
              <div className="finance-compare-bar is-in" style={{ width: `${barPct(periodIncome)}%` }} />
            </div>
            <span className="finance-compare-value">{v(periodIncome)}</span>
          </div>
          <div className="finance-compare-row">
            <span className="finance-compare-label">
              Money Out
              <small>{withDepartments ? "Expenses & department funds" : "Expenses"}</small>
            </span>
            <div className="finance-compare-track">
              <div className="finance-compare-bar is-out" style={{ width: `${barPct(periodOut)}%` }} />
            </div>
            <span className="finance-compare-value">{v(periodOut)}</span>
          </div>
        </div>
      ) : null}

      {!loading && (
        <UpcomingLine upcoming={upcoming} fundBalance={fundBalance} open={showUpcoming} onToggle={onToggleUpcoming} />
      )}
    </div>
  );
}

/** One sentence on the coming department activities, with a button that shows the list. */
function UpcomingLine({
  upcoming,
  fundBalance,
  open,
  onToggle,
}: {
  upcoming: FinanceUpcoming;
  fundBalance: number;
  open: boolean;
  onToggle: () => void;
}) {
  const { count, totalStillNeeded, fundAfter, untilLabel } = upcoming;
  const short = fundAfter < 0;
  const activities = `${count} ${count === 1 ? "activity" : "activities"}`;

  const kind = count === 0 ? "is-none" : totalStillNeeded <= 0 ? "is-ready" : short ? "is-short" : "is-enough";
  const icon = count === 0 ? "fa-calendar" : short ? "fa-triangle-exclamation" : "fa-circle-check";

  return (
    <div className={`upcoming-summary ${kind}`}>
      <i className={`fa-solid ${icon}`} aria-hidden="true" />
      {count === 0 ? (
        <p>No department activities coming up until {untilLabel}.</p>
      ) : totalStillNeeded <= 0 ? (
        <p>All {activities} until {untilLabel} already have their budget given.</p>
      ) : (
        <p>
          <strong>{fmtPeso(totalStillNeeded)}</strong> needs to be prepared for {activities} until {untilLabel}.{" "}
          {short ? (
            <>
              The General Fund has {fmtPeso(fundBalance)} today, so it is <strong>short by {fmtPeso(-fundAfter)}</strong>.
            </>
          ) : (
            <>The General Fund has enough.</>
          )}
        </p>
      )}
      <button
        type="button"
        className="finance-glance-more"
        aria-expanded={open}
        aria-controls="finance-upcoming"
        onClick={onToggle}
      >
        {open ? "Hide activities" : "See activities"}
        <i className={`fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"}`} aria-hidden="true" />
      </button>
    </div>
  );
}
