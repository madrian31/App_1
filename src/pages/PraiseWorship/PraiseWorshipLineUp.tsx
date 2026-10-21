import { Link, useSearchParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import usePraiseWorshipLineUp from "../../hooks/usePraiseWorshipLineUp";
import LineUpSlotRow from "../../components/praiseWorship/LineUpSlotRow";
import SongListEditor from "../../components/praiseWorship/SongListEditor";
import Toast from "../../components/members/Toast";
import { PW_SLOTS } from "../../types/praiseWorship";
import "../ProgramLineUp/programLineUp.css"; // shared line-up row + text card styles
import "../Ledger/ledger.css"; // .ledger-field form fields
import "./praiseWorship.css";

// TODO: replace with the actual logged-in user's name once auth/session
// wiring is in place — mirrors the TODO in ProgramLineUp.tsx.
const CURRENT_USER = "Unknown";

function formatServiceDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PraiseWorshipLineUp() {
  const [searchParams] = useSearchParams();
  const {
    date,
    setDate,
    loading,
    loadError,
    saving,
    toast,

    teamCount,
    optionsFor,
    assignments,
    setSlot,

    songs,
    addSongs,
    renameSong,
    removeSong,
    moveSong,
    practiceDate,
    setPracticeDate,
    practiceTime,
    setPracticeTime,

    message,
    submit,
    copyMessage,
  } = usePraiseWorshipLineUp(CURRENT_USER, searchParams.get("date") ?? undefined);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Praise &amp; Worship Line-up</h1>
              <p>{date ? formatServiceDate(date) : "Pick a service date."}</p>
            </div>
            <div className="page-header-actions">
              <Link to="/PraiseWorship/Members" className="btn-secondary">
                <i className="fa-solid fa-users" aria-hidden="true" />
                Team Members
              </Link>
            </div>
          </div>

          <div className="toolbar">
            <div className="filter-select-wrap">
              <i className="fa-regular fa-calendar" aria-hidden="true" />
              <input
                type="date"
                aria-label="Service date"
                value={date}
                onChange={(e) => e.target.value && setDate(e.target.value)}
                style={{ border: "none", background: "transparent" }}
              />
            </div>
            <button className="btn-add" onClick={submit} disabled={saving || loading}>
              <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
              {saving ? "Saving…" : "Save Line-up"}
            </button>
          </div>

          {loadError && (
            <div className="modal-error pw-banner">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {loadError}
            </div>
          )}

          {!loading && teamCount === 0 && (
            <div className="pw-notice">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              <span>
                There are no Praise &amp; Worship members yet. Add them on the{" "}
                <Link to="/PraiseWorship/Members">Team Members</Link> page first.
              </span>
            </div>
          )}

          <div className="pw-lineup-grid">
            <div className="lineup-card pw-lineup-card" aria-busy={loading}>
              {PW_SLOTS.map((slot) => (
                <LineUpSlotRow
                  key={slot.key}
                  slot={slot}
                  people={assignments[slot.key] ?? []}
                  options={optionsFor(slot.skill)}
                  disabled={loading}
                  onChange={(people) => setSlot(slot.key, people)}
                />
              ))}
            </div>

            <div>
              <div className="lineup-text-card">
                <h2 className="pw-card-title">
                  Songs
                  {songs.length > 0 && <span className="pw-card-count">{songs.length}</span>}
                </h2>
                <SongListEditor
                  songs={songs}
                  disabled={loading}
                  onAdd={addSongs}
                  onRename={renameSong}
                  onRemove={removeSong}
                  onMove={moveSong}
                />
              </div>

              <div className="lineup-text-card">
                <h2 className="pw-card-title">Practice Time</h2>
                <div className="lineup-text-row pw-practice-row">
                  <div className="ledger-field">
                    <label htmlFor="pw-practice-date">Date</label>
                    <input
                      id="pw-practice-date"
                      type="date"
                      value={practiceDate}
                      disabled={loading}
                      onChange={(e) => setPracticeDate(e.target.value)}
                    />
                  </div>
                  <div className="ledger-field">
                    <label htmlFor="pw-practice-time">Time</label>
                    <input
                      id="pw-practice-time"
                      type="time"
                      value={practiceTime}
                      disabled={loading}
                      onChange={(e) => setPracticeTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="lineup-text-card">
                <h2 className="pw-card-title">Message for the Group Chat</h2>
                <pre className="pw-message">{message}</pre>
                <button type="button" className="btn-secondary pw-copy-btn" onClick={copyMessage}>
                  <i className="fa-regular fa-copy" aria-hidden="true" />
                  Copy Message
                </button>
              </div>
            </div>
          </div>

          <Toast message={toast} />
        </div>
      </main>
    </div>
  );
}
