import { useEffect, useRef, useState } from "react";

/** Curated set of Font Awesome (free, solid) icons relevant to church/ministry
 *  calendar categories. Kept as a fixed list so users pick visually instead
 *  of typing a class name they likely don't know. */
const ICON_OPTIONS = [
  "fa-solid fa-tag",
  "fa-solid fa-star",
  "fa-solid fa-heart",
  "fa-solid fa-calendar-day",
  "fa-solid fa-calendar-check",
  "fa-solid fa-cake-candles",
  "fa-solid fa-ring",
  "fa-solid fa-gift",
  "fa-solid fa-champagne-glasses",
  "fa-solid fa-person-running",
  "fa-solid fa-users",
  "fa-solid fa-handshake",
  "fa-solid fa-hands-praying",
  "fa-solid fa-church",
  "fa-solid fa-dove",
  "fa-solid fa-cross",
  "fa-solid fa-book",
  "fa-solid fa-graduation-cap",
  "fa-solid fa-note-sticky",
  "fa-solid fa-bullhorn",
  "fa-solid fa-bell",
  "fa-solid fa-microphone",
  "fa-solid fa-music",
  "fa-solid fa-umbrella-beach",
  "fa-solid fa-plane",
  "fa-solid fa-car",
  "fa-solid fa-house-chimney",
  "fa-solid fa-utensils",
  "fa-solid fa-briefcase",
  "fa-solid fa-medal",
  "fa-solid fa-trophy",
  "fa-solid fa-flag",
  "fa-solid fa-camera",
  "fa-solid fa-video",
  "fa-solid fa-comment",
  "fa-solid fa-thumbtack",
  "fa-solid fa-map-pin",
  "fa-solid fa-envelope",
  "fa-solid fa-clock",
];

interface Props {
  value: string;
  onChange: (icon: string) => void;
}

export default function IconPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="icon-picker" ref={wrapRef}>
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={() => setOpen((o) => !o)}
        title="Choose an icon"
      >
        <i className={value || "fa-solid fa-tag"} aria-hidden="true" />
      </button>

      {open && (
        <div className="icon-picker-grid">
          {ICON_OPTIONS.map((icon) => (
            <button
              type="button"
              key={icon}
              className={`icon-picker-option${value === icon ? " active" : ""}`}
              onClick={() => {
                onChange(icon);
                setOpen(false);
              }}
              title={icon}
            >
              <i className={icon} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
