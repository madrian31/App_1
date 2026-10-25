import { useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Bookkeeping for pages that save every change on their own (no Save button): how many saves are
 * running, which failed, and a retry. Each save has a key (one per field) so only the newest
 * failed save of a field is retried — never an older value over a newer one.
 */
export default function useAutoSave() {
  const [pending, setPending] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [savedOnce, setSavedOnce] = useState(false);
  const failed = useRef(new Map<string, () => Promise<void>>());
  const latest = useRef(new Map<string, number>());

  async function save(key: string, task: () => Promise<void>) {
    const mine = (latest.current.get(key) ?? 0) + 1;
    latest.current.set(key, mine);
    setPending((n) => n + 1);
    try {
      await task();
      if (latest.current.get(key) === mine) failed.current.delete(key);
      setSavedOnce(true);
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
      if (latest.current.get(key) === mine) failed.current.set(key, task);
    } finally {
      setFailedCount(failed.current.size);
      setPending((n) => n - 1);
    }
  }

  function retryFailed() {
    [...failed.current.entries()].forEach(([key, task]) => save(key, task));
  }

  const status: AutoSaveStatus = pending > 0 ? "saving" : failedCount > 0 ? "error" : savedOnce ? "saved" : "idle";

  return { save, retryFailed, status, markSaved: () => setSavedOnce(true) };
}
