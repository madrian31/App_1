import { Link, useSearchParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useProgramLineUpSchedule, { MONTHS } from"../../hooks/useProgramLineUpSchedule";
import type { ScheduleQuickRange } from "../../hooks/useProgramLineUpSchedule";
import type { ProgramType } from "../../types/programLineUp";
import "./programLineUp.css";
import "../Pledges/pledgesMembers.css"; // shared quick-range / month-range toolbar styles

const QUICK_RANGES: { value: ScheduleQuickRange; label: string }[] = [
  { value: "thisMonth", label: "This Month" },
  { value: "next3Months", label: "Next 3 Months" },
  { value: "custom", label: "Custom Range" },
];

const TYPE_LABELS: Record<ProgramType, string> = {
  traditional: "Traditional",
  contemporary: "Contemporary",
  prayerMeeting: "Prayer Meeting",
};

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function ProgramLineUpSchedule() {
  const [searchParams] = useSearchParams();
  const {
    quickRange,
    onQuickRangeChange,
    fromMonth,
    setFromMonth,
    fromYear,
    setFromYear,
    toMonth,
    setToMonth,
    toYear,
    setToYear,
    years,
    loading,
    error,
    entries,
  } = useProgramLineUpSchedule(searchParams.get("from") ?? undefined, searchParams.get("to") ?? undefined);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Program Line-up Schedule</h1>
              <p>
                {MONTHS[fromMonth]} {fromYear} – {MONTHS[toMonth]} {toYear}
              </p>
            </div>
            <div className="page-header-actions">
              <Link to="/ProgramLineUp" className="btn-secondary">
                <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                Back to Line-up
              </Link>
            </div>
          </div>

          <div className="toolbar-row report-range-row">
            <div className="quick-range-group">
              {QUICK_RANGES.map((r) => (
                <button
                  key={r.value}
                  className={`quick-range-btn${quickRange === r.value ? " active" : ""}`}
                  onClick={() => onQuickRangeChange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="month-range-wrap">
              <div className="filter-select-wrap">
                <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="filter-select-wrap">
                <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <span className="month-range-arrow">→</span>

              <div className="filter-select-wrap">
                <select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="filter-select-wrap">
                <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))}>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="members-card">
            <div className="table-scroll">
              <table className="members-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Presider</th>
                    <th>Speaker</th>
                    <th className="col-hide-mobile">Special Number</th>
                    <th className="col-hide-mobile">Usher</th>
                    <th className="col-hide-mobile">Flower Family</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="empty-cell">
                        <div className="empty-state"><p>Loading…</p></div>
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-cell">
                        <div className="empty-state">
                          <i className="fa-regular fa-calendar" />
                          <p>No line-ups scheduled for this range yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    entries.map((e) => (
                      <tr key={e.id}>
                        <td><span className="date-text">{formatDisplayDate(e.date)}</span></td>
                        <td>
                          <span className={`badge badge-${e.programType}`}>{TYPE_LABELS[e.programType]}</span>
                        </td>
                        <td>{e.presider.name}</td>
                        <td>{e.speaker.name}</td>
                        <td className="col-hide-mobile">{e.specialNumber?.name ?? "—"}</td>
                        <td className="col-hide-mobile">{e.usher?.name ?? "—"}</td>
                        <td className="col-hide-mobile">{e.flowerFamily?.name ?? "—"}</td>
                        <td>
                          <div className="actions-cell">
                            <Link to={`/ProgramLineUp?date=${e.date}`} className="btn-icon" title="Edit">
                              <i className="fa-regular fa-pen-to-square" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
