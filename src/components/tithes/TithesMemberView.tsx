import useTithesByMember, { type MemberTitheFilter } from "../../hooks/useTithesByMember";
import { formatDisplayDate, toLocalISODate } from "../../utils/date";
import { lastSundayISO } from "../../hooks/useTithes";
import TithesMemberTable from "./TithesMemberTable";

function fmt(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "2026-10-18" → "Sunday, October 18, 2026" — easier to read than the browser's 10/18/2026. */
function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const FILTER_OPTIONS: { value: MemberTitheFilter; label: string }[] = [
  { value: "all", label: "All members" },
  { value: "given", label: "With tithe" },
  { value: "notGiven", label: "No tithe yet" },
];

interface TithesMemberViewProps {
  currentUser: string;
  canManage: boolean;
}

/** "Members" tab of the Tithes page — every active member with an inline amount for one date. */
export default function TithesMemberView({ currentUser, canManage }: TithesMemberViewProps) {
  const {
    date,
    setDate,
    prevSunday,
    nextSunday,
    search,
    setSearch,
    filter,
    setFilter,
    members,
    memberCount,
    loading,
    entries,
    rowStatus,
    handleAmountChange,
    flushSave,
    total,
    giverCount,
  } = useTithesByMember(currentUser);

  const todayISO = toLocalISODate(new Date());
  const thisSunday = lastSundayISO();
  const nextWeek = new Date(`${date}T00:00:00`);
  nextWeek.setDate(nextWeek.getDate() + 7);
  // No tithes to record for services that haven't happened yet.
  const canGoNext = toLocalISODate(nextWeek) <= todayISO;

  return (
    <>
      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-card-value" style={{ color: "var(--success)" }}>
            {fmt(total)}
          </span>
          <span className="summary-card-label">Total — {formatDisplayDate(date)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-value">{giverCount}</span>
          <span className="summary-card-label">Members gave</span>
        </div>
        <div className="summary-card">
          <span className="summary-card-value">{memberCount}</span>
          <span className="summary-card-label">Active members</span>
        </div>
      </div>

      <div className="toolbar">
        <div className="finance-period-stepper tithe-date-stepper">
          <button type="button" onClick={prevSunday} aria-label="Previous week" title="Previous week">
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          {/* Readable date ("Sunday, October 18, 2026"); clicking it opens the browser's date picker. */}
          <label className="tithe-date-label" title="Pick a date">
            <span aria-live="polite">{longDate(date)}</span>
            <i className="fa-regular fa-calendar" aria-hidden="true" />
            <input
              type="date"
              className="tithe-date-input"
              value={date}
              max={todayISO}
              aria-label="Pick a date"
              onClick={(e) => e.currentTarget.showPicker?.()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={nextSunday}
            disabled={!canGoNext}
            aria-label="Next week"
            title="Next week"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
        {date !== thisSunday && (
          <button type="button" className="finance-period-today" onClick={() => setDate(thisSunday)}>
            Back to this Sunday
          </button>
        )}

        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search member…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-select-wrap">
          <i className="fa-solid fa-filter" aria-hidden="true" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as MemberTitheFilter)}>
            {FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="members-card">
        <TithesMemberTable
          members={members}
          entries={entries}
          rowStatus={rowStatus}
          loading={loading}
          canManage={canManage}
          onAmountChange={handleAmountChange}
          onBlur={flushSave}
        />
      </div>
    </>
  );
}
