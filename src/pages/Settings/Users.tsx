import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import Toast from "../../components/members/Toast";
import UserFormModal from "../../components/settings/UserFormModal";
import ResetPasswordModal from "../../components/settings/ResetPasswordModal";
import useUserAccounts from "../../hooks/useUserAccounts";
import { useAuth, useCurrentUserName } from "../../auth/authContext";
import { USER_ROLE_LABELS, type AppUser } from "../../types/auth";
import "../Ledger/ledger.css"; // .ledger-field form fields
import "../Visitation/visitation.css"; // member search picker
import "./users.css";

function formatLastActive(iso?: string): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type ModalState = { kind: "add" } | { kind: "edit"; account: AppUser } | { kind: "reset"; account: AppUser } | null;

export default function UsersPage() {
  const { user } = useAuth();
  const currentUserName = useCurrentUserName();
  const { accounts, loading, error, toast, activeAdminCount, create, update, setActive, resetPassword } =
    useUserAccounts(currentUserName);
  const [modal, setModal] = useState<ModalState>(null);

  function confirmTurnOff(account: AppUser) {
    const ok = window.confirm(
      `Turn off ${account.displayName}'s account? They won't be able to sign in until you turn it back on.`
    );
    if (ok) setActive(account, false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Users</h1>
              <p>
                {accounts.length} account{accounts.length !== 1 ? "s" : ""} · Make and manage who can sign in to LINK
                Up.
              </p>
            </div>
            <div className="page-header-actions">
              <button className="btn-add" onClick={() => setModal({ kind: "add" })}>
                <i className="fa-solid fa-user-plus" aria-hidden="true" />
                Add User
              </button>
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
                    <th>Name</th>
                    <th>Username</th>
                    <th className="col-hide-mobile">Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="col-hide-mobile">Last active</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        <div className="empty-state">
                          <p>Loading accounts…</p>
                        </div>
                      </td>
                    </tr>
                  ) : accounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-cell">
                        <div className="empty-state">
                          <i className="fa-solid fa-user-gear" />
                          <p>No accounts yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    accounts.map((a) => {
                      const isSelf = a.uid === user?.uid;
                      const isLastAdmin = a.role === "admin" && a.isActive && activeAdminCount <= 1;
                      return (
                        <tr key={a.uid} className={a.isActive ? "" : "account-row-off"}>
                          <td>
                            <div className="member-cell">
                              <div className="avatar">{(a.displayName || a.username).slice(0, 1).toUpperCase()}</div>
                              <span className="member-name">
                                {a.displayName}
                                {isSelf && <span className="account-you">You</span>}
                              </span>
                            </div>
                          </td>
                          <td>{a.username}</td>
                          <td className="col-hide-mobile">{a.email || <span className="account-muted">None</span>}</td>
                          <td>
                            <span className={`badge account-badge-${a.role}`}>{USER_ROLE_LABELS[a.role]}</span>
                          </td>
                          <td>
                            <span className={`badge ${a.isActive ? "account-badge-on" : "account-badge-off"}`}>
                              {a.isActive ? "Active" : "Turned off"}
                            </span>
                          </td>
                          <td className="col-hide-mobile">
                            <span className="date-text">{formatLastActive(a.lastLoginAt)}</span>
                          </td>
                          <td>
                            <div className="actions-cell">
                              <button className="btn-icon" title="Edit account" onClick={() => setModal({ kind: "edit", account: a })}>
                                <i className="fa-regular fa-pen-to-square" />
                              </button>
                              {/* Your own password is changed from the key button in the menu. */}
                              {!isSelf && (
                                <button className="btn-icon" title="Reset password" onClick={() => setModal({ kind: "reset", account: a })}>
                                  <i className="fa-solid fa-key" />
                                </button>
                              )}
                              {!isSelf &&
                                (a.isActive ? (
                                  <button
                                    className="btn-icon danger"
                                    title={isLastAdmin ? "The only Admin can't be turned off" : "Turn off account"}
                                    disabled={isLastAdmin}
                                    onClick={() => confirmTurnOff(a)}
                                  >
                                    <i className="fa-solid fa-user-slash" />
                                  </button>
                                ) : (
                                  <button className="btn-icon" title="Turn account back on" onClick={() => setActive(a, true)}>
                                    <i className="fa-solid fa-user-check" />
                                  </button>
                                ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="account-page-note">
            <i className="fa-solid fa-circle-info" aria-hidden="true" /> <strong>Admin</strong> can use every page and
            manage accounts here. <strong>User</strong> can use every page except this one. People with an email can
            reset a forgotten password from the sign-in page; for everyone else, use the key button above.
          </p>

          <Toast message={toast} />

          {(modal?.kind === "add" || modal?.kind === "edit") && (
            <UserFormModal
              account={modal.kind === "edit" ? modal.account : undefined}
              isSelf={modal.kind === "edit" && modal.account.uid === user?.uid}
              isLastAdmin={activeAdminCount <= 1}
              onCreate={create}
              onUpdate={update}
              onClose={() => setModal(null)}
            />
          )}
          {modal?.kind === "reset" && (
            <ResetPasswordModal account={modal.account} onReset={resetPassword} onClose={() => setModal(null)} />
          )}
        </div>
      </main>
    </div>
  );
}
