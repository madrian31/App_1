import type { AttendanceTrackee } from "../../hooks/useAttendanceTracker";
import { MONTHS_SHORT } from "../../hooks/useAttendanceTracker";
import PageHeader from "../members/PageHeader";
import "../../pages/Attendance/attendance.css";

interface AttendanceCardProps<T extends AttendanceTrackee> {
  title: string;
  countLabel: string;
  addButtonLabel?: string;
  onAdd?: () => void;

  loading: boolean;
  viewMonth: number;
  monthLabel: string;
  sundays: number[];
  monthKey: string;

  goPrevMonth: () => void;
  goNextMonth: () => void;

  search: string;
  onSearchChange: (value: string) => void;

  attendance: Record<string, Record<string, Record<number, boolean>>>;
  toggleAttendance: (trackeeId: string, day: number) => void;

  paginatedTrackees: { trackee: T; total: number }[];
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  start: number;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
}

/** Reusable Sundays-of-the-month attendance table. Pair with useAttendanceTracker. */
export default function AttendanceCard<T extends AttendanceTrackee>({
  title,
  countLabel,
  addButtonLabel,
  onAdd,
  loading,
  viewMonth,
  monthLabel,
  sundays,
  monthKey,
  goPrevMonth,
  goNextMonth,
  search,
  onSearchChange,
  attendance,
  toggleAttendance,
  paginatedTrackees,
  filteredCount,
  currentPage,
  totalPages,
  start,
  goFirst,
  goPrev,
  goNext,
  goLast,
}: AttendanceCardProps<T>) {
  return (
    <>
      <PageHeader
        title={title}
        count={filteredCount}
        countLabel={countLabel}
        onAddMember={onAdd}
        addButtonLabel={addButtonLabel}
      />

      <div className="toolbar attendance-toolbar">
        <div className="attendance-month-nav">
          <button className="nav-btn" aria-label="Previous month" onClick={goPrevMonth}>
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <span className="period-label">
            {monthLabel}
            <span className="badge badge-category attendance-count-badge">{sundays.length} Sundays</span>
          </span>
          <button className="nav-btn" aria-label="Next month" onClick={goNextMonth}>
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div className="attendance-search-wrap">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="members-card">
        <div className="table-scroll">
          {loading ? (
            <div className="empty-state">
              <p>Loading attendance…</p>
            </div>
          ) : paginatedTrackees.length === 0 ? (
            <div className="empty-state">
              <i className="fa-regular fa-calendar-xmark" aria-hidden="true" />
              <p>{search ? "No results match your search." : "Nothing to show yet."}</p>
            </div>
          ) : (
            <table className="members-table attendance-table">
              <thead>
                <tr>
                  <th className="member-col">Name</th>
                  {sundays.map((day) => (
                    <th key={day}>
                      <span className="dow">Sun</span>
                      {MONTHS_SHORT[viewMonth]} {day}
                    </th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrackees.map(({ trackee, total }) => (
                  <tr key={trackee.id}>
                    <td className="member-col">
                      <span className="member-name">{trackee.name}</span>
                    </td>
                    {sundays.map((day) => {
                      const checked = !!attendance[monthKey]?.[trackee.id]?.[day];
                      return (
                        <td key={day}>
                          <button
                            className={checked ? "chk checked" : "chk"}
                            onClick={() => toggleAttendance(trackee.id, day)}
                            aria-label={`Toggle attendance for ${trackee.name} on Sun ${MONTHS_SHORT[viewMonth]} ${day}`}
                          >
                            {checked && <i className="fa-solid fa-check" aria-hidden="true" />}
                          </button>
                        </td>
                      );
                    })}
                    <td className="total-col">
                      {total}/{sundays.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filteredCount > 0 && (
          <div className="table-footer">
            <div className="footer-left">
              <span>
                Showing {start + 1}–{Math.min(start + paginatedTrackees.length, filteredCount)} of {filteredCount}
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
    </>
  );
}