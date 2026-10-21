import { useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import type { SongItem } from "../../hooks/usePraiseWorshipLineUp";

interface SongListEditorProps {
  songs: SongItem[];
  disabled?: boolean;
  onAdd: (text: string) => void; // one title, or several lines pasted at once
  onRename: (key: string, title: string) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
}

export default function SongListEditor({ songs, disabled, onAdd, onRename, onRemove, onMove }: SongListEditorProps) {
  const [draft, setDraft] = useState("");

  function addDraft() {
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addDraft();
    }
  }

  // Pasting a whole list (e.g. from the group chat) adds every line as its
  // own song; a single line pastes into the box as usual.
  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\n")) return;
    e.preventDefault();
    onAdd(text);
  }

  return (
    <div className="pw-song-editor">
      {songs.length === 0 ? (
        <p className="pw-songs-empty">No songs yet. Add the first song below.</p>
      ) : (
        <ol className="pw-song-list">
          {songs.map((song, i) => {
            const name = song.title.trim() || `song ${i + 1}`;
            return (
              <li key={song.key} className="pw-song-row">
                <span className="pw-song-num" aria-hidden="true">
                  {i + 1}
                </span>
                <input
                  type="text"
                  className="pw-song-input"
                  value={song.title}
                  placeholder="Song title"
                  aria-label={`Song ${i + 1}`}
                  disabled={disabled}
                  onChange={(e) => onRename(song.key, e.target.value)}
                />
                <div className="pw-song-actions">
                  <button
                    type="button"
                    className="btn-icon"
                    title="Move up"
                    aria-label={`Move ${name} up`}
                    disabled={disabled || i === 0}
                    onClick={() => onMove(song.key, -1)}
                  >
                    <i className="fa-solid fa-arrow-up" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    title="Move down"
                    aria-label={`Move ${name} down`}
                    disabled={disabled || i === songs.length - 1}
                    onClick={() => onMove(song.key, 1)}
                  >
                    <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn-icon danger"
                    title="Remove song"
                    aria-label={`Remove ${name}`}
                    disabled={disabled}
                    onClick={() => onRemove(song.key)}
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="pw-song-add">
        <input
          type="text"
          placeholder="Type a song title, then press Enter"
          aria-label="Add a song"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <button type="button" className="btn-secondary" onClick={addDraft} disabled={disabled || !draft.trim()}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add
        </button>
      </div>
      <p className="pw-field-hint">Tip: you can paste the whole song list from the group chat. Each line becomes one song.</p>
    </div>
  );
}
