import { useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import AutoSaveInput from "../../components/settings/AutoSaveInput";
import AutoSaveStatus from "../../components/settings/AutoSaveStatus";
import useDepartmentSettings from "../../hooks/useDepartmentSettings";
import { useCurrentUserName } from "../../auth/authContext";
import "./settings.css";

export default function DepartmentsSettings() {
  const currentUser = useCurrentUserName();
  const s = useDepartmentSettings(currentUser);
  const [newName, setNewName] = useState("");

  async function handleAdd() {
    if (await s.add(newName)) setNewName("");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Departments</h1>
              <p>The church's departments, such as Youth, Men's and Women's.</p>
            </div>
            <div className="page-header-actions">
              <AutoSaveStatus status={s.saveStatus} onRetry={s.retryFailed} />
            </div>
          </div>

          {s.error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {s.error}
            </div>
          )}

          {s.notice && (
            <div className="modal-error visit-form-error dept-notice">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {s.notice}
              <button type="button" className="btn-icon" title="Dismiss" aria-label="Dismiss" onClick={s.dismissNotice}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          )}

          <div className="members-card lookup-list-card">
            <div className="lookup-list-add-row dept-add-row">
              <input
                type="text"
                placeholder="Add a department, e.g. Music Ministry…"
                aria-label="New department name"
                value={newName}
                disabled={s.adding}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={handleAdd} disabled={s.adding || !newName.trim()}>
                <i className="fa-solid fa-plus" aria-hidden="true" />
                {s.adding ? "Adding…" : "Add"}
              </button>
            </div>

            <div className="table-scroll">
              <table className="members-table dept-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Leader</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {s.loading ? (
                    <tr>
                      <td colSpan={3} className="empty-cell">
                        <div className="empty-state">
                          <p>Loading departments…</p>
                        </div>
                      </td>
                    </tr>
                  ) : s.departments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="empty-cell">
                        <div className="empty-state">
                          <i className="fa-regular fa-folder-open" />
                          <p>No departments yet. Add one above.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    s.departments.map((d) => (
                      <tr key={d.id} className={d.isActive ? undefined : "dept-row-inactive"}>
                        <td>
                          <AutoSaveInput
                            className="dept-input"
                            aria-label="Department name"
                            value={d.name}
                            onCommit={(v) => s.rename(d.id, v)}
                          />
                        </td>
                        <td>
                          <AutoSaveInput
                            className="dept-input"
                            aria-label={`${d.name} leader`}
                            placeholder="Optional"
                            value={d.leader}
                            onCommit={(v) => s.setLeader(d.id, v)}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`dept-status-btn${d.isActive ? " is-active" : ""}`}
                            aria-pressed={d.isActive}
                            title={d.isActive ? "Click to mark as inactive" : "Click to mark as active"}
                            onClick={() => s.setActive(d.id, !d.isActive)}
                          >
                            <i className={`fa-solid ${d.isActive ? "fa-circle-check" : "fa-circle-pause"}`} aria-hidden="true" />
                            {d.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <ul className="dept-help">
              <li>
                Budgets are set for each activity in{" "}
                <Link to="/Finance/DepartmentFunds">Finance → Department Funds</Link>. A department's budget for the
                year is the total of its activities.
              </li>
              <li>
                Write the department's name in the <strong>IN-CHARGE</strong> column of the Calendar of Activities (for
                example "Youth Dept.") so its activities are matched to it automatically.
              </li>
              <li>
                A department that is no longer used can be marked <strong>Inactive</strong>. It is hidden from new
                records, but its past records are kept.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
