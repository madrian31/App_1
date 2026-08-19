import { useEffect, useState } from "react";
import { getLineUpsInRange } from "../services/programLineUp/programLineUpService";
import type { ProgramLineUpEntry } from "../types/programLineUp";

export type ScheduleQuickRange = "thisMonth" | "next3Months" | "custom";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthStartISO(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}
function monthEndISO(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10);
}

function resolveQuickRange(range: ScheduleQuickRange, now: Date) {
  const m = now.getMonth();
  const y = now.getFullYear();
  switch (range) {
    case "thisMonth":
      return { fromMonth: m, fromYear: y, toMonth: m, toYear: y };
    case "next3Months": {
      const d = new Date(y, m + 2, 1);
      return { fromMonth: m, fromYear: y, toMonth: d.getMonth(), toYear: d.getFullYear() };
    }
    case "custom":
    default:
      return { fromMonth: m, fromYear: y, toMonth: m, toYear: y };
  }
}

/** Parses "YYYY-MM" into { month (0-indexed), year }, or null if invalid/absent. */
function parseYearMonth(value?: string | null): { month: number; year: number } | null {
  if (!value) return null;
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) return null;
  return { year: y, month: m - 1 };
}

/** Optional `initialFrom`/`initialTo` (format "YYYY-MM") let the Auto-Generate
 *  flow deep-link straight into the range it just generated, instead of the
 *  page defaulting back to "This Month". */
export default function useProgramLineUpSchedule(initialFrom?: string, initialTo?: string) {
  const now = new Date();
  const parsedFrom = parseYearMonth(initialFrom);
  const parsedTo = parseYearMonth(initialTo);
  const hasInitialRange = Boolean(parsedFrom && parsedTo);
  const initial = hasInitialRange ? null : resolveQuickRange("thisMonth", now);

  const [quickRange, setQuickRange] = useState<ScheduleQuickRange>(hasInitialRange ? "custom" : "thisMonth");
  const [fromMonth, setFromMonthState] = useState(parsedFrom?.month ?? initial!.fromMonth);
  const [fromYear, setFromYearState] = useState(parsedFrom?.year ?? initial!.fromYear);
  const [toMonth, setToMonthState] = useState(parsedTo?.month ?? initial!.toMonth);
  const [toYear, setToYearState] = useState(parsedTo?.year ?? initial!.toYear);

  const [entries, setEntries] = useState<ProgramLineUpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

  function onQuickRangeChange(range: ScheduleQuickRange) {
    setQuickRange(range);
    if (range !== "custom") {
      const r = resolveQuickRange(range, now);
      setFromMonthState(r.fromMonth);
      setFromYearState(r.fromYear);
      setToMonthState(r.toMonth);
      setToYearState(r.toYear);
    }
  }

  function setFromMonth(m: number) { setFromMonthState(m); setQuickRange("custom"); }
  function setFromYear(y: number) { setFromYearState(y); setQuickRange("custom"); }
  function setToMonth(m: number) { setToMonthState(m); setQuickRange("custom"); }
  function setToYear(y: number) { setToYearState(y); setQuickRange("custom"); }

  const dateFrom = monthStartISO(fromYear, fromMonth);
  const dateTo = monthEndISO(toYear, toMonth);

  async function refetch() {
    setLoading(true);
    setError(null);
    try {
      const list = await getLineUpsInRange(dateFrom, dateTo);
      setEntries(list.sort((a, b) => (a.date < b.date ? -1 : 1)));
    } catch (err) {
      console.error("Failed to load schedule:", err);
      setError("Failed to load schedule.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, [dateFrom, dateTo]);

  return {
    quickRange,
    onQuickRangeChange,
    fromMonth,
    setFromMonth,
    fromYear,
    setFromYear,
    toMonth,
    setToMonth,
    toYear,
    setToYear,
    years,
    loading,
    error,
    entries,
    refetch,
  };
}
