import { displayChildName } from "../../types/sundaySchoolChild";
import type { SundaySchoolChild } from "../../types/sundaySchoolChild";

interface SundaySchoolAttendanceTableProps {
  children: SundaySchoolChild[];
  loading: boolean;
  sundays: number[];
  monthShortLabel: string;
  attendance: Record<string, Record<number, boolean>>;
  onToggle: (childId: string, day: number) => void;
}

export default function SundaySchoolAttendanceTable({
  children,
  loading,
  sundays,
  monthShortLabel,
  attendance,
  onToggle,
}: SundaySchoolAttendanceTableProps) {
  const colCount = sundays.length + 2; // Name + each Sunday + Total

  return (
    <div className="table-scroll">
      <table className="members-table attendance-table">
        <thead>
          <tr>
            <th className="member-col">Name</th>
            {sundays.map((day) => (
              <th key={day}>
                <span className="dow">Sun</span>
                {monthShortLabel} {day}
              </th>
            ))}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <p>Loading attendance…</p>
                </div>
              </td>
            </tr>
          ) : children.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-face-smile" />
                  <p>No children found.</p>
                </div>
              </td>
            </tr>
          ) : (
            children.map((child) => {
              const total = sundays.filter((day) => attendance[child.id]?.[day]).length;
              return (
                <tr key={child.id}>
                  <td className="member-col">{displayChildName(child)}</td>
                  {sundays.map((day) => {
                    const present = Boolean(attendance[child.id]?.[day]);
                    return (
                      <td key={day}>
                        <button
                          type="button"
                          className={`chk${present ? " checked" : ""}`}
                          onClick={() => onToggle(child.id, day)}
                          aria-label={`${displayChildName(child)} — Sunday ${monthShortLabel} ${day}`}
                        >
                          {present && <i className="fa-solid fa-check" />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="total-col">
                    {total}/{sundays.length}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
