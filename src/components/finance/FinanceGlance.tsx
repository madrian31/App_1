import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { FinanceUpcoming } from "../../hooks/useFinanceReport";
import { fmtPeso } from "./financeFormat";
import { getFinanceStatus, type FinanceStatusKind } from "./financeStatus";

interface FinanceGlanceProps {
  loading: boolean;
  periodLabel: string;
  currentPeriod: boolean; // the period includes today
  startBalance: number; // fund just before the period
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
 * church members): how much the fund has, whether it went up or down, fund in vs fund
 * out, and what still needs to be prepared for coming activities. Every other number is
 * under "Show full details".
 */
export default function FinanceGlance({
  loading,
  periodLabel,
  currentPeriod,
  startBalance,
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
  // Department funds only join "fund out" in periods where departments were given or returned budget.
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
            <div className="finance-glance-pill-row">
              <span className="finance-glance-pill">
                <i className={`fa-solid ${m.icon}`} aria-hidden="true" />
                {m.headline}
              </span>
              {m.kind !== "empty" && (
                <WhyButton>
                  <WhyText
                    kind={m.kind}
                    periodLabel={periodLabel}
                    currentPeriod={currentPeriod}
                    income={periodIncome}
                    out={periodOut}
                    deptNet={withDepartments ? periodDeptGiven - periodDeptReturned : 0}
                    startBalance={startBalance}
                    endBalance={endBalance}
                  />
                </WhyButton>
              )}
            </div>
            {m.figure ? (
              <span className="finance-glance-change">
                <strong>
                  {m.kind === "covered" ? "−" : ""}
                  {m.figure.value}
                </strong>{" "}
                {m.figure.label}
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
          aria-label={`Fund in ${v(periodIncome)}, fund out ${v(periodOut)} ${inPeriod}`}
        >
          <div className="finance-compare-row">
            <span className="finance-compare-label">
              Fund In
              <small>Tithes &amp; offerings</small>
            </span>
            <div className="finance-compare-track">
              <div className="finance-compare-bar is-in" style={{ width: `${barPct(periodIncome)}%` }} />
            </div>
            <span className="finance-compare-value">{v(periodIncome)}</span>
          </div>
          <div className="finance-compare-row">
            <span className="finance-compare-label">
              Fund Out
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

/** A "?" beside the verdict: shows why on hover, and stays open when clicked (or tapped). */
function WhyButton({ children }: { children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    function handlePointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setPinned(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPinned(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pinned]);

  const open = hovered || pinned;
  return (
    <span
      className="finance-why"
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        className="finance-why-btn"
        aria-label="Why?"
        aria-expanded={open}
        aria-controls="finance-why-pop"
        onClick={() => setPinned((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span className="finance-why-pop" id="finance-why-pop" role="tooltip">
          {children}
        </span>
      )}
    </span>
  );
}

/** Why the fund went up or down, in plain words with the actual amounts. */
function WhyText({
  kind,
  periodLabel,
  currentPeriod,
  income,
  out,
  deptNet,
  startBalance,
  endBalance,
}: {
  kind: FinanceStatusKind;
  periodLabel: string;
  currentPeriod: boolean;
  income: number;
  out: number;
  deptNet: number; // budget given to departments less what they returned; 0 when none
  startBalance: number;
  endBalance: number;
}) {
  const when = periodLabel.includes("–") ? `From ${periodLabel}` : `In ${periodLabel}`;
  const diff = fmtPeso(Math.abs(income - out));
  const fundIn = <strong>fund in ({fmtPeso(income)})</strong>;
  const fundOut = <strong>fund out ({fmtPeso(out)})</strong>;

  return (
    <>
      <span className="finance-why-title">Why?</span>
      <span className="finance-why-line">
        {kind === "surplus" && (
          <>
            {when}, {fundIn} was more than {fundOut}. The {diff} left over was added to the General Fund.
          </>
        )}
        {kind === "covered" && (
          <>
            {when}, {fundOut} was more than {fundIn}. The {diff} difference was paid from the General Fund.
          </>
        )}
        {kind === "deficit" && (
          <>
            {when}, {fundOut} was more than {fundIn}, and the General Fund did not have enough to pay the
            rest. {fmtPeso(-endBalance)} is still needed.
          </>
        )}
        {kind === "balanced" && (
          <>
            {when}, fund in and fund out were both {fmtPeso(income)}, so the General Fund did not change.
          </>
        )}
      </span>
      {deptNet !== 0 && (
        <span className="finance-why-line">
          {deptNet > 0
            ? `Fund out includes ${fmtPeso(deptNet)} budget given to departments.`
            : `Departments returned ${fmtPeso(-deptNet)} of unused budget, which was taken off the fund out.`}
        </span>
      )}
      <span className="finance-why-flow">
        <span>
          Before {periodLabel}
          <strong>{fmtPeso(startBalance)}</strong>
        </span>
        <i className="fa-solid fa-arrow-right" aria-hidden="true" />
        <span>
          {currentPeriod ? "Now" : `End of ${periodLabel}`}
          <strong>{fmtPeso(endBalance)}</strong>
        </span>
      </span>
    </>
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
