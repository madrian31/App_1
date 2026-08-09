interface VisitSummaryCardsProps {
  totalVisits: number;
  uniqueMembers: number;
}

export default function VisitSummaryCards({ totalVisits, uniqueMembers }: VisitSummaryCardsProps) {
  return (
    <div className="summary-cards">
      <div className="summary-card">
        <span className="summary-card-value">{totalVisits}</span>
        <span className="summary-card-label">Total Visits</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value">{uniqueMembers}</span>
        <span className="summary-card-label">Unique Members</span>
      </div>
    </div>
  );
}
