import { useEffect, useMemo, useRef, useState } from "react";
import { deleteOffering, getOfferings, saveOffering } from "../services/offerings/offeringsService";
import type { OfferingService } from "../types/offering";
import { toLocalISODate } from "../utils/date";

export type RowSaveStatus = "saving" | "saved" | "error";

export const OFFERING_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SAVE_DEBOUNCE_MS = 800;
const SAVED_BADGE_MS = 1500;

export interface ServiceDay {
  date: string; // ISO
  service: OfferingService;
  isFuture: boolean; // hasn't happened yet — nothing to record
}

interface EntryState {
  amount: string;
  exists: boolean; // a doc is stored for this date (so clearing the amount deletes it)
}

/** Every Wednesday and Sunday in the month — the services that take an offering. */
function getServiceDays(year: number, month: number, todayISO: string): ServiceDay[] {
  const days: ServiceDay[] = [];
  for (const d = new Date(year, month, 1); d.getMonth() === month; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 3) continue;
    const date = toLocalISODate(d);
    days.push({ date, service: dow === 0 ? "Sunday" : "Wednesday", isFuture: date > todayISO });
  }
  return days;
}

/**
 * Drives the Offerings page: one month at a time (‹ › stepper), every Wednesday and
 * Sunday service listed with an amount input that auto-saves (debounced, flushed on blur).
 * Clearing an amount removes that service's offering.
 */
export default function useOfferings(currentUser: string) {
  const now = new Date();
  const [todayISO] = useState(() => toLocalISODate(new Date())); // fixed for the life of the page

  const [curYear, setCurYear] = useState(now.getFullYear());
  const [curMonth, setCurMonth] = useState(now.getMonth());

  const [entries, setEntries] = useState<Record<string, EntryState>>({}); // keyed by ISO date
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<Record<string, RowSaveStatus | undefined>>({});

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savedClearTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Latest values per date, so a debounced save always writes what's on screen.
  const latest = useRef<Record<string, EntryState>>({});

  const monthKey = `${curYear}-${curMonth}`;
  const loading = loadedKey !== monthKey;
  const days = useMemo(() => getServiceDays(curYear, curMonth, todayISO), [curYear, curMonth, todayISO]);

  useEffect(() => {
    let cancelled = false;
    const from = toLocalISODate(new Date(curYear, curMonth, 1));
    const to = toLocalISODate(new Date(curYear, curMonth + 1, 0));
    getOfferings(from, to)
      .then((list) => {
        if (cancelled) return;
        const map: Record<string, EntryState> = {};
        list.forEach((o) => (map[o.date] = { amount: String(o.amount ?? ""), exists: true }));
        latest.current = map;
        setEntries(map);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load offerings:", err);
        setError("Failed to load offerings.");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(`${curYear}-${curMonth}`);
      });
    return () => {
      cancelled = true;
    };
  }, [curYear, curMonth]);

  // Cancel pending timers when switching months, so a stale save can't land later.
  useEffect(() => {
    const timers = saveTimers.current;
    const clearTimers = savedClearTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
      Object.values(clearTimers).forEach(clearTimeout);
      saveTimers.current = {};
      savedClearTimers.current = {};
      setRowStatus({});
    };
  }, [curYear, curMonth]);

  function stepMonth(direction: -1 | 1) {
    const d = new Date(curYear, curMonth + direction, 1);
    setCurYear(d.getFullYear());
    setCurMonth(d.getMonth());
  }

  function goToCurrentMonth() {
    setCurYear(now.getFullYear());
    setCurMonth(now.getMonth());
  }

  const isCurrentMonth = curYear === now.getFullYear() && curMonth === now.getMonth();
  const canStepForward = toLocalISODate(new Date(curYear, curMonth + 1, 0)) < todayISO;

  function setStatus(date: string, status: RowSaveStatus | undefined) {
    setRowStatus((prev) => {
      const next = { ...prev };
      if (status) next[date] = status;
      else delete next[date];
      return next;
    });
  }

  function markSaving(date: string) {
    if (savedClearTimers.current[date]) {
      clearTimeout(savedClearTimers.current[date]);
      delete savedClearTimers.current[date];
    }
    setStatus(date, "saving");
  }

  function markSaved(date: string) {
    setStatus(date, "saved");
    savedClearTimers.current[date] = setTimeout(() => {
      setStatus(date, undefined);
      delete savedClearTimers.current[date];
    }, SAVED_BADGE_MS);
  }

  function updateEntry(date: string, patch: Partial<EntryState>) {
    const prev = latest.current[date] ?? { amount: "", exists: false };
    latest.current = { ...latest.current, [date]: { ...prev, ...patch } };
    setEntries(latest.current);
  }

  async function writeEntry(day: ServiceDay) {
    const entry = latest.current[day.date];
    if (!entry) return;
    const amount = parseFloat(entry.amount) || 0;

    // Nothing stored and nothing to store — e.g. typed then cleared before the save fired.
    if (amount <= 0 && !entry.exists) {
      setStatus(day.date, undefined);
      return;
    }

    markSaving(day.date);
    try {
      if (amount <= 0) {
        await deleteOffering(day.date);
        updateEntry(day.date, { exists: false });
      } else {
        await saveOffering({ date: day.date, service: day.service, amount, addedBy: currentUser });
        updateEntry(day.date, { exists: true });
      }
      markSaved(day.date);
    } catch (err) {
      console.error("Failed to save offering:", err);
      setStatus(day.date, "error");
    }
  }

  function handleAmountChange(day: ServiceDay, value: string) {
    updateEntry(day.date, { amount: value });
    if (saveTimers.current[day.date]) clearTimeout(saveTimers.current[day.date]);
    markSaving(day.date);
    saveTimers.current[day.date] = setTimeout(() => {
      delete saveTimers.current[day.date];
      writeEntry(day);
    }, SAVE_DEBOUNCE_MS);
  }

  /** Saves right away on blur — but only if an edit is still pending. */
  function flushSave(day: ServiceDay) {
    if (!saveTimers.current[day.date]) return;
    clearTimeout(saveTimers.current[day.date]);
    delete saveTimers.current[day.date];
    writeEntry(day);
  }

  const totals = useMemo(() => {
    const amountOf = (date: string) => parseFloat(entries[date]?.amount || "0") || 0;
    const sum = (service?: OfferingService) =>
      days.filter((d) => !service || d.service === service).reduce((s, d) => s + amountOf(d.date), 0);
    const recorded = days.filter((d) => amountOf(d.date) > 0).length;
    const total = sum();
    return {
      total,
      sundayTotal: sum("Sunday"),
      wednesdayTotal: sum("Wednesday"),
      recordedCount: recorded,
      pastServiceCount: days.filter((d) => !d.isFuture).length,
      averagePerService: recorded > 0 ? total / recorded : 0,
    };
  }, [days, entries]);

  return {
    curYear,
    curMonth,
    monthLabel: `${OFFERING_MONTHS[curMonth]} ${curYear}`,
    stepMonth,
    goToCurrentMonth,
    isCurrentMonth,
    canStepForward,

    days,
    entries,
    rowStatus,
    loading,
    error,

    handleAmountChange,
    flushSave,

    ...totals,
  };
}
