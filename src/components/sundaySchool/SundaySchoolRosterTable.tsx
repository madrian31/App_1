import { useNavigate } from "react-router-dom";
import { displayChildName, computeAge } from "../../types/sundaySchoolChild";
import type { SundaySchoolChild } from "../../types/sundaySchoolChild";

interface SundaySchoolRosterTableProps {
  children: SundaySchoolChild[];
  loading: boolean;
  onToggleActive: (id: string) => void;
}

const COL_COUNT = 5;

export default function SundaySchoolRosterTable({ children, loading, onToggleActive }: SundaySchoolRosterTableProps) {
  const navigate = useNavigate();

  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Age</th>
            <th className="col-hide-mobile">Guardian</th>
            <th className="col-hide-mobile">Date Enrolled</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <p>Loading roster…</p>
                </div>
              </td>
            </tr>
          ) : children.length === 0 ? (
            <tr>
              <td colSpan={COL_COUNT} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-face-smile" />
                  <p>No children found.</p>
                </div>
              </td>
            </tr>
          ) : (
            children.map((c) => {
              const age = computeAge(c.birthday);
              const overAgeLimit = age !== null && age >= 13;
              return (
                <tr key={c.id}>
                  <td>
                    <span className="member-name">{displayChildName(c)}</span>
                  </td>
                  <td>
                    {age === null ? (
                      <span className="date-text">—</span>
                    ) : (
                      <span style={overAgeLimit ? { color: "var(--danger)", fontWeight: 600 } : undefined}>
                        {age}
                        {overAgeLimit && (
                          <i
                            className="fa-solid fa-triangle-exclamation"
                            style={{ marginLeft: 6 }}
                            title="Over the Sunday School age limit (13+)"
                          />
                        )}
                      </span>
                    )}
                  </td>
                  <td className="col-hide-mobile">
                    {c.guardianName ? c.guardianName : <span className="date-text">—</span>}
                  </td>
                  <td className="col-hide-mobile">
                    <span className="date-text">{c.dateEnrolled}</span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-icon"
                        title="Edit"
                        onClick={() => navigate(`/SundaySchool/SundaySchoolKidsMembers/${c.id}`)}
                      >
                        <i className="fa-regular fa-pen-to-square" />
                      </button>
                      <button
                        className={`btn-icon${c.isActive ? " danger" : ""}`}
                        title={c.isActive ? "Mark as dropped" : "Mark as active"}
                        onClick={() => onToggleActive(c.id)}
                      >
                        <i className={`fa-solid ${c.isActive ? "fa-user-minus" : "fa-user-check"}`} />
                      </button>
                    </div>
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
