import { Sidebar } from "../../components/sidebar/Sidebar";
import usePledgeTracker from "../../hooks/usePledgeTracker";
import PledgeTrackerFilters from "../../components/pledges/PledgeTrackerFilters";
import PledgeTrackerTable from "../../components/pledges/PledgeTrackerTable";
import "./pledgesMembers.css";

// TODO: replace with the actual logged-in user once auth/session wiring is in place.
const CURRENT_USER = "Unknown";

function fmt(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PledgeTracker() {
  const {
    pledgers,
    loadingPledgers,
    memberId,
    setMemberId,
    memberName,
    curMonth,
    setCurMonth,
    curYear,
    setCurYear,
    years,
    sundays,
    entries,
    rowStatus,
    loadingEntries,
    handleAmountChange,
    handleNotesChange,
    commitAmount,
    commitNotes,
    total,
    paidCount,
    exportCSV,
  } = usePledgeTracker(CURRENT_USER);

  const sundayCount = sundays.length;
  const collectionRate = sundayCount > 0 ? Math.round((paidCount / sundayCount) * 100) : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Pledge Tracker</h1>
              <p>{memberName ? `Recording pledges for ${memberName}` : "Select a pledger to begin recording Sundays."}</p>
            </div>
          </div>

          <div className="summary-cards">
            <div className="summary-card">
              <span className="summary-card-value">{sundayCount}</span>
              <span className="summary-card-label">Sundays this month</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{paidCount}</span>
              <span className="summary-card-label">Collected</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{fmt(total)}</span>
              <span className="summary-card-label">Total Collected</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{collectionRate}%</span>
              <span className="summary-card-label">Collection Rate</span>
            </div>
          </div>

          <PledgeTrackerFilters
            pledgers={pledgers}
            loadingPledgers={loadingPledgers}
            memberId={memberId}
            onMemberChange={setMemberId}
            curMonth={curMonth}
            onMonthChange={setCurMonth}
            curYear={curYear}
            onYearChange={setCurYear}
            years={years}
            onExportCSV={exportCSV}
            exportDisabled={!memberId}
          />

          <div className="members-card">
            <PledgeTrackerTable
              sundays={sundays}
              entries={entries}
              rowStatus={rowStatus}
              loading={loadingEntries}
              disabled={!memberId}
              onAmountChange={handleAmountChange}
              onNotesChange={handleNotesChange}
              onCommitAmount={commitAmount}
              onCommitNotes={commitNotes}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
