function fmt(n: number): string {
  return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TithesKpiStripProps {
  total: number;
  giverCount: number;
  averagePerService: number;
  entryCount: number;
}

export default function TithesKpiStrip({ total, giverCount, averagePerService, entryCount }: TithesKpiStripProps) {
  return (
    <div className="summary-cards">
      <div className="summary-card">
        <span className="summary-card-value" style={{ color: "var(--success)" }}>
          {fmt(total)}
        </span>
        <span className="summary-card-label">Total Tithes</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value">{giverCount}</span>
        <span className="summary-card-label">Givers</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value">{fmt(averagePerService)}</span>
        <span className="summary-card-label">Avg. per Service</span>
      </div>
      <div className="summary-card">
        <span className="summary-card-value">{entryCount}</span>
        <span className="summary-card-label">Entries</span>
      </div>
    </div>
  );
}
