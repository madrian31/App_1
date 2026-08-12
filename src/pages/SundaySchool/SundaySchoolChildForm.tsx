import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useSundaySchoolChildForm from "../../hooks/useSundaySchoolChildForm";
import "./sundaySchool.css";

// TODO: replace with the actual logged-in user once auth/session wiring is in place.
const CURRENT_USER = "Unknown";

export default function SundaySchoolChildForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { form, isEditing, loading, saving, error, update, submit } = useSundaySchoolChildForm(id, CURRENT_USER);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await submit();
    if (ok) navigate("/SundaySchool/SundaySchoolKidsMembers");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
          <div className="page">
            <p>Loading…</p>
          </div>
        </main>
      </div>
    );
  }

  const nameIncomplete = !form.firstName.trim() || !form.lastName.trim();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>{isEditing ? "Edit Child" : "Add Child"}</h1>
              <p>Fill in a first and last name, or at least a nickname if the child's full name isn't known yet.</p>
            </div>
          </div>

          <form className="members-card child-form" onSubmit={handleSubmit}>
            {error && (
              <div className="modal-error">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="form-row form-row-split">
              <div>
                <label>First Name</label>
                <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
              </div>
              <div>
                <label>Last Name</label>
                <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
              </div>
            </div>

            <div className="form-row">
              <label>
                Nickname
                {nameIncomplete && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
              </label>
              <input
                type="text"
                placeholder="e.g. Bunso, Toto, Ate Ling…"
                value={form.nickname}
                onChange={(e) => update("nickname", e.target.value)}
              />
              {nameIncomplete && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Required since first and last name aren't both filled in.
                </span>
              )}
            </div>

            <div className="form-row">
              <label>Birthday (optional)</label>
              <input type="date" value={form.birthday} onChange={(e) => update("birthday", e.target.value)} />
            </div>

            <div className="form-row form-row-split">
              <div>
                <label>Guardian Name (optional)</label>
                <input
                  type="text"
                  value={form.guardianName}
                  onChange={(e) => update("guardianName", e.target.value)}
                />
              </div>
              <div>
                <label>Guardian Contact (optional)</label>
                <input
                  type="text"
                  value={form.guardianContact}
                  onChange={(e) => update("guardianContact", e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/SundaySchool/SundaySchoolKidsMembers")}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Child"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
