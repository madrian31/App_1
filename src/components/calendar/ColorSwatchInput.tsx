import { useEffect, useRef, useState } from "react";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/** Curated preset palette so users who don't know a hex code — but have a
 *  color in mind — can just click something close, or use "Custom color"
 *  below for anything else via the browser's own color-area picker
 *  (no need to touch the RGB number boxes at all). */
const PRESET_COLORS = [
  "#E74C3C", "#D35400", "#E67E22", "#F1C40F", "#2ECC71", "#27AE60",
  "#16A085", "#1ABC9C", "#3498DB", "#2980B9", "#5B4AB7", "#8E44AD",
  "#9B59B6", "#E91E63", "#C0392B", "#A6335A", "#795548", "#3F688A",
  "#237070", "#2F6B47", "#9A7300", "#654A91", "#607D8B", "#34495E",
];

interface Props {
  value: string; // hex, e.g. "#534AB7"
  onChange: (hex: string) => void;
  title?: string;
}

/**
 * Color input with three ways to set a value:
 *  1. Click a preset swatch (no hex knowledge needed).
 *  2. "Custom color…" — opens the browser's native color picker. Its
 *     RGB/Hex toggle is controlled by the browser/OS and can't be forced
 *     to Hex, but it's opt-in here (not the default interaction) and the
 *     gradient area itself lets you pick visually without touching the
 *     RGB number boxes at all.
 *  3. Type a hex code directly, for anyone who has one.
 */
export default function ColorSwatchInput({ value, onChange, title }: Props) {
  const [draft, setDraft] = useState(value);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const customPickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function commitIfValid(raw: string) {
    const normalized = raw.startsWith("#") ? raw : `#${raw}`;
    if (HEX_RE.test(normalized)) {
      onChange(normalized);
    } else {
      setDraft(value); // invalid input — revert to the last good value
    }
  }

  function pickPreset(hex: string) {
    onChange(hex);
    setOpen(false);
  }

  return (
    <div className="color-swatch-input" ref={wrapRef}>
      <button
        type="button"
        className="color-swatch-preview"
        style={{ background: HEX_RE.test(value) ? value : "#8a8a8a" }}
        title={title || "Choose a color"}
        onClick={() => setOpen((o) => !o)}
      />
      <input
        ref={inputRef}
        type="text"
        className="color-hex-input"
        value={draft}
        maxLength={7}
        spellCheck={false}
        placeholder="#534AB7"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commitIfValid(draft)}
        onKeyDown={(e) => e.key === "Enter" && commitIfValid(draft)}
      />

      {open && (
        <div className="color-picker-popover">
          <div className="color-preset-grid">
            {PRESET_COLORS.map((hex) => (
              <button
                type="button"
                key={hex}
                className={`color-preset-swatch${value.toUpperCase() === hex ? " active" : ""}`}
                style={{ background: hex }}
                title={hex}
                onClick={() => pickPreset(hex)}
              />
            ))}
          </div>
          <button
            type="button"
            className="color-custom-row"
            onClick={() => customPickerRef.current?.click()}
          >
            <span className="color-custom-swatch" style={{ background: value }} />
            Custom color…
          </button>
          {/* Hidden native picker — only opens when "Custom color…" is clicked,
              so the browser's RGB-default dialog is opt-in, not the default path. */}
          <input
            ref={customPickerRef}
            type="color"
            className="color-native-hidden"
            value={HEX_RE.test(value) ? value : "#000000"}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}