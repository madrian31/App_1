import type { MemberRangeRow } from "../../hooks/useMembersAttendanceReport";

interface AttendanceReportTableProps {
  rows: MemberRangeRow[];
  sundayCounts: number[];
  monthLabels: string[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  start: number;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
}

export default function AttendanceReportTable({
  rows,
  sundayCounts,
  monthLabels,
  loading,
  search,
  onSearchChange,
  filteredCount,
  currentPage,
  totalPages,
  start,
  goFirst,
  goPrev,
  goNext,
  goLast,
}: AttendanceReportTableProps) {
  const colCount = monthLabels.length + 3; // Member + selected months + Total + % + Status

  return (
    <div className="members-card">
      <div className="toolbar attendance-toolbar">
        <div className="attendance-search-wrap">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search member…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="table-scroll">
        <table className="members-table attendance-table report-table">
          <thead>
            <tr>
              <th className="member-col">Member</th>
              {monthLabels.map((label, i) => (
                <th key={`${label}-${i}`}>{label}</th>
              ))}
              <th>Total</th>
              <th>%</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colCount} className="empty-cell">
                  <div className="empty-state">
                    <p>Loading attendance report…</p>
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="empty-cell">
                  <div className="empty-state">
                    <i className="fa-regular fa-calendar-xmark" aria-hidden="true" />
                    <p>{search ? "No results match your search." : "No members found."}</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td className="member-col">
                    <span className="member-name">{row.name}</span>
                  </td>
                  {row.perMonth.map((attended, i) => (
                    <td key={i} className="report-cell">
                      {attended}/{sundayCounts[i]}
                    </td>
                  ))}
                  <td className="total-col">
                    {row.totalAttended}/{row.totalPossible}
                  </td>
                  <td className="report-cell">{row.percent}%</td>
                  <td>
                    {row.needsFollowUp ? (
                      <span className="badge badge-followup">
                        <i className="fa-solid fa-arrow-trend-down" aria-hidden="true" /> Follow-up
                      </span>
                    ) : (
                      <span className="badge badge-good">
                        <i className="fa-solid fa-check" aria-hidden="true" /> Good
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredCount > 0 && (
        <div className="table-footer">
          <div className="footer-left">
            <span>
              Showing {start + 1}–{Math.min(start + rows.length, filteredCount)} of {filteredCount} members
            </span>
          </div>

          <div className="page-nav">
            <button className="page-btn" disabled={currentPage === 1} onClick={goFirst} aria-label="First page">
              <i className="fa-solid fa-angles-left" aria-hidden="true" />
            </button>
            <button className="page-btn" disabled={currentPage === 1} onClick={goPrev} aria-label="Previous page">
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <span className="page-indicator">
              Page {currentPage} of {totalPages}
            </span>
            <button className="page-btn" disabled={currentPage === totalPages} onClick={goNext} aria-label="Next page">
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
            <button className="page-btn" disabled={currentPage === totalPages} onClick={goLast} aria-label="Last page">
              <i className="fa-solid fa-angles-right" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}