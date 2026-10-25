import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";

interface AutoSaveInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "onBlur"> {
  value: string;
  /** Saves the typed text. Return false to reject it — the saved value is put back when the field loses focus. */
  onCommit: (value: string) => boolean;
  /** Pause in typing before saving, in ms. */
  delay?: number;
}

/** A text/number field that saves itself: shortly after typing stops, when it loses focus or on Enter,
 *  and when the page is left mid-edit. Escape puts the saved value back. */
export default function AutoSaveInput({ value, onCommit, delay = 800, onKeyDown, ...rest }: AutoSaveInputProps) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timer = useRef<number | undefined>(undefined);
  const unsaved = useRef<string | null>(null); // typed but not handed to onCommit yet
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  });

  // Follow the saved value when it changes from outside (a save, or switching years).
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  // Leaving the page within the typing pause still saves.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (unsaved.current !== null) commitRef.current(unsaved.current);
    },
    []
  );

  function commitNow(text: string): boolean {
    window.clearTimeout(timer.current);
    unsaved.current = null;
    return commitRef.current(text);
  }

  function handleChange(text: string) {
    setDraft(text);
    unsaved.current = text;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => commitNow(text), delay);
  }

  function handleBlur() {
    const pending = unsaved.current;
    if (pending === null && draft === value) return;
    if (!commitNow(pending ?? draft)) setDraft(value);
  }

  return (
    <input
      {...rest}
      value={draft}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          window.clearTimeout(timer.current);
          unsaved.current = null;
          setDraft(value);
        }
        onKeyDown?.(e);
      }}
    />
  );
}
