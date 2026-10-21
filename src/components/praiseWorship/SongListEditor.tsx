import { useRef, useState } from "react";
import type { ClipboardEvent, KeyboardEvent } from "react";
import type { SongItem } from "../../hooks/usePraiseWorshipLineUp";

interface SongListEditorProps {
  songs: SongItem[];
  disabled?: boolean;
  onAdd: (title: string, artist: string) => void;
  onUpdate: (key: string, patch: Partial<Pick<SongItem, "title" | "artist">>) => void;
  onRemove: (key: string) => void;
  onMove: (key: string, direction: -1 | 1) => void;
}

export default function SongListEditor({ songs, disabled, onAdd, onUpdate, onRemove, onMove }: SongListEditorProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  function addDraft() {
    if (!title.trim()) return;
    onAdd(title, artist);
    setTitle("");
    setArtist("");
    // Straight back to the title box, ready for the next song.
    titleRef.current?.focus();
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
    onAdd(text, "");
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
                <div className="pw-song-fields">
                  <input
                    type="text"
                    className="pw-song-input"
                    value={song.title}
                    placeholder="Song title"
                    aria-label={`Song ${i + 1} title`}
                    disabled={disabled}
                    onChange={(e) => onUpdate(song.key, { title: e.target.value })}
                  />
                  <input
                    type="text"
                    className="pw-song-input pw-song-artist"
                    value={song.artist}
                    placeholder="Add artist"
                    aria-label={`Song ${i + 1} artist`}
                    disabled={disabled}
                    onChange={(e) => onUpdate(song.key, { artist: e.target.value })}
                  />
                </div>
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
          ref={titleRef}
          type="text"
          placeholder="Song title"
          aria-label="New song title"
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />
        <div className="pw-song-add-row">
          <input
            type="text"
            placeholder="Artist (optional)"
            aria-label="New song artist"
            value={artist}
            disabled={disabled}
            onChange={(e) => setArtist(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="btn-secondary" onClick={addDraft} disabled={disabled || !title.trim()}>
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Add
          </button>
        </div>
      </div>
      <p className="pw-field-hint">
        Tip: you can paste the whole song list from the group chat. Each line becomes one song, and "Title - Artist"
        fills in both.
      </p>
    </div>
  );
}
