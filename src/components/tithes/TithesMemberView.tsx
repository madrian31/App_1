import useTithesByMember, { type MemberTitheFilter } from "../../hooks/useTithesByMember";
import { formatDisplayDate } from "../../utils/date";
import TithesMemberTable from "./TithesMemberTable";

function fmt(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    handleNotesChange,
    flushSave,
    total,
    giverCount,
  } = useTithesByMember(currentUser);

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
        <div className="tithe-date-nav">
          <button className="btn-icon" title="Previous week" onClick={prevSunday}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          <button className="btn-icon" title="Next week" onClick={nextSunday}>
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>

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
          onNotesChange={handleNotesChange}
          onBlur={flushSave}
        />
      </div>
    </>
  );
}
