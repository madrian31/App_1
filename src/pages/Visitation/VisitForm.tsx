import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useVisitForm from "../../hooks/useVisitForm";
import MemberSearchSelect from "../../components/visitation/MemberSearchSelect";
import "./visitation.css";

// TODO: replace with the actual logged-in user once auth/session wiring is in place.
const CURRENT_USER = "Unknown";

const DEPARTMENTS = ["Men's Dept.", "Women's Dept.", "Youth Dept."];
const PURPOSE_OPTIONS = ["Follow-up", "Encouragement", "Home Visit", "Prayer", "Outreach"];

export default function VisitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    form,
    isEditing,
    loading,
    saving,
    error,
    update,
    selectMember,
    addParticipant,
    removeParticipant,
    submit,
  } = useVisitForm(id, CURRENT_USER);

  const [participantInput, setParticipantInput] = useState("");

  function handleParticipantKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addParticipant(participantInput);
      setParticipantInput("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await submit();
    if (ok) navigate("/Visitation");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
          <div className="page">
            <p>Loading visit…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>{isEditing ? "Edit Visit" : "Record Visit"}</h1>
              <p>{isEditing ? "Update the details of this visit." : "Log a new visitation record."}</p>
            </div>
          </div>

          <form className="members-card visit-form" onSubmit={handleSubmit}>
            {error && (
              <div className="modal-error visit-form-error">
                <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                {error}
              </div>
            )}

            <div className="form-row">
              <label>Member</label>
              <MemberSearchSelect
                value={form.memberId}
                displayName={form.memberName}
                onSelect={selectMember}
              />
            </div>

            <div className="form-row form-row-split">
              <div>
                <label>Date</label>
                <input
                  type="date"
                  className="date-input"
                  value={form.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </div>

              <div>
                <label>Department</label>
                <div className="filter-select-wrap">
                  <select value={form.department} onChange={(e) => update("department", e.target.value)}>
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-row form-row-split">
              <div>
                <label>Leader</label>
                <input
                  type="text"
                  placeholder="e.g. Bro. Pedro"
                  value={form.leader}
                  onChange={(e) => update("leader", e.target.value)}
                />
              </div>

              <div>
                <label>Purpose</label>
                <input
                  type="text"
                  list="purpose-options"
                  placeholder="e.g. Follow-up"
                  value={form.purpose}
                  onChange={(e) => update("purpose", e.target.value)}
                />
                <datalist id="purpose-options">
                  {PURPOSE_OPTIONS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="form-row">
              <label>Participants</label>
              <div className="participant-input-wrap">
                <input
                  type="text"
                  placeholder="Type a name and press Enter…"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  onKeyDown={handleParticipantKeyDown}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    addParticipant(participantInput);
                    setParticipantInput("");
                  }}
                >
                  Add
                </button>
              </div>
              {form.participants.length > 0 && (
                <div className="participant-chips">
                  {form.participants.map((p) => (
                    <span className="participant-chip" key={p}>
                      {p}
                      <button type="button" onClick={() => removeParticipant(p)} aria-label={`Remove ${p}`}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Notes</label>
              <textarea
                rows={4}
                placeholder="Any details about the visit…"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate("/Visitation")}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : isEditing ? "Save Changes" : "Record Visit"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
