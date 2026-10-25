import { Link, useSearchParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import usePraiseWorshipLineUp from "../../hooks/usePraiseWorshipLineUp";
import LineUpSlotRow from "../../components/praiseWorship/LineUpSlotRow";
import SongListEditor from "../../components/praiseWorship/SongListEditor";
import Toast from "../../components/members/Toast";
import { PW_SLOTS } from "../../types/praiseWorship";
import { useCanEdit, useCurrentUserName } from "../../auth/authContext";
import "../ProgramLineUp/programLineUp.css"; // shared line-up row + text card styles
import "../Ledger/ledger.css"; // .ledger-field form fields
import "./praiseWorship.css";

function formatServiceDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function PraiseWorshipLineUp() {
  const currentUser = useCurrentUserName();
  const canEdit = useCanEdit(); // Users only view the line-up
  const [searchParams] = useSearchParams();
  const {
    date,
    changeDate,
    loading,
    loadError,
    saving,
    saveError,
    retrySave,
    hasSavedEntry,
    toast,

    teamCount,
    optionsFor,
    assignments,
    setSlot,

    songs,
    addSongs,
    updateSong,
    removeSong,
    moveSong,
    practiceDate,
    setPracticeDate,
    practiceTime,
    setPracticeTime,

    message,
    copyMessage,
  } = usePraiseWorshipLineUp(currentUser, searchParams.get("date") ?? undefined, canEdit);

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
                onChange={(e) => changeDate(e.target.value)}
                style={{ border: "none", background: "transparent" }}
              />
            </div>
            {/* No Save button — changes save on their own; this says where that's at. */}
            <div className="pw-save-status-wrap" role="status" aria-live="polite">
              {loading ? null : !canEdit ? (
                hasSavedEntry ? null : (
                  <span className="pw-save-status pw-save-status--muted">
                    <i className="fa-solid fa-circle-info" aria-hidden="true" />
                    The line-up for this date hasn't been set yet.
                  </span>
                )
              ) : saveError ? (
                <span className="pw-save-status pw-save-status--error">
                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                  Could not save. Check your internet connection.
                  <button type="button" className="pw-link-btn" onClick={retrySave}>
                    Try again
                  </button>
                </span>
              ) : saving ? (
                <span className="pw-save-status pw-save-status--muted">
                  <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
                  Saving…
                </span>
              ) : hasSavedEntry ? (
                <span className="pw-save-status">
                  <i className="fa-solid fa-circle-check" aria-hidden="true" />
                  All changes saved
                </span>
              ) : (
                <span className="pw-save-status pw-save-status--muted">
                  <i className="fa-solid fa-cloud" aria-hidden="true" />
                  Changes save automatically
                </span>
              )}
            </div>
          </div>

          {loadError && (
            <div className="modal-error pw-banner">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {loadError}
            </div>
          )}

          {canEdit && !loading && teamCount === 0 && (
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
                  readOnly={!canEdit}
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
                {canEdit ? (
                  <SongListEditor
                    songs={songs}
                    disabled={loading}
                    onAdd={addSongs}
                    onUpdate={updateSong}
                    onRemove={removeSong}
                    onMove={moveSong}
                  />
                ) : songs.length === 0 ? (
                  <p className="pw-songs-empty">No songs yet.</p>
                ) : (
                  <ol className="pw-song-list">
                    {songs.map((song, i) => (
                      <li key={song.key} className="pw-song-row pw-song-row--view">
                        <span className="pw-song-num" aria-hidden="true">
                          {i + 1}
                        </span>
                        <span>
                          {song.title}
                          {song.artist && <span className="date-text"> — {song.artist}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
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
                      readOnly={!canEdit}
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
                      readOnly={!canEdit}
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
