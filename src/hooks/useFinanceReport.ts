import { useEffect, useMemo, useState } from "react";
import { getGeneralFundSettings } from "../services/finance/financeSettingsService";
import { getTithes } from "../services/tithes/tithesService";
import { getExpenses } from "../services/expenses/expensesService";
import type { Expense } from "../types/expense";
import type { GeneralFundSettings } from "../types/finance";
import type { Tithe } from "../types/tithe";
import { formatDisplayDate, toLocalISODate } from "../utils/date";

export const FINANCE_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const FINANCE_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Month / Year are stepped with ‹ › arrows; Custom shows From / To dates. */
export type FinancePeriodMode = "month" | "year" | "custom";

export const FINANCE_PERIOD_MODES: { value: FinancePeriodMode; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
  { value: "custom", label: "Custom" },
];

export interface FinanceMonthRow {
  key: string; // "2026-9"
  year: number;
  month: number; // 0–11
  label: string; // "Oct", or "Oct 2026" when the rows span more than one year
  tithes: number;
  expenses: number;
  net: number;
  /** General Fund balance at the end of this month; null for months still in the future. */
  balance: number | null;
}

export interface FinanceSundayRow {
  date: string; // ISO
  givers: number;
  total: number;
}

export interface FinanceCategoryRow {
  category: string;
  total: number;
  /** Share of the period's tithes this category used up; null when there were no tithes. */
  pctOfTithes: number | null;
}

function monthStartISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month, 1));
}
function monthEndISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month + 1, 0));
}
function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}
function addDays(iso: string, days: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

function sumAmounts(list: { amount: number }[]): number {
  return list.reduce((s, t) => s + (t.amount || 0), 0);
}

/** The whole month or year containing `anchor`. */
function periodAround(mode: Exclude<FinancePeriodMode, "custom">, anchor: Date): { from: string; to: string } {
  const y = anchor.getFullYear();
  const m = anchor.getMonth();
  return mode === "month"
    ? { from: monthStartISO(y, m), to: monthEndISO(y, m) }
    : { from: monthStartISO(y, 0), to: monthEndISO(y, 11) };
}

/** "October 2026", "2026", "Aug – Oct 2026", or "Aug 3, 2026 – Oct 19, 2026". */
function describePeriod(from: string, to: string): string {
  const f = parseISO(from);
  const t = parseISO(to);
  const startsOnMonth = f.getDate() === 1;
  const endsOnMonth = to === monthEndISO(t.getFullYear(), t.getMonth());
  if (startsOnMonth && endsOnMonth) {
    const sameYear = f.getFullYear() === t.getFullYear();
    if (sameYear && f.getMonth() === t.getMonth()) return `${FINANCE_MONTHS[f.getMonth()]} ${f.getFullYear()}`;
    if (sameYear && f.getMonth() === 0 && t.getMonth() === 11) return String(f.getFullYear());
    if (sameYear) return `${FINANCE_MONTHS_SHORT[f.getMonth()]} – ${FINANCE_MONTHS_SHORT[t.getMonth()]} ${t.getFullYear()}`;
    return `${FINANCE_MONTHS_SHORT[f.getMonth()]} ${f.getFullYear()} – ${FINANCE_MONTHS_SHORT[t.getMonth()]} ${t.getFullYear()}`;
  }
  return from === to ? formatDisplayDate(from) : `${formatDisplayDate(from)} – ${formatDisplayDate(to)}`;
}

/**
 * Drives the Finance Report for any period (a month, a year, or custom From/To): the General Fund
 * balance (starting balance + tithes − expenses), period KPIs, a month-by-month breakdown,
 * per-Sunday totals and expenses by category. Totals only — no per-member amounts,
 * since individual giving is private.
 */
export default function useFinanceReport() {
  const now = new Date();
  const todayISO = toLocalISODate(now);

  const [mode, setMode] = useState<FinancePeriodMode>("month");
  const [dateFrom, setDateFrom] = useState(() => periodAround("month", new Date()).from);
  const [dateTo, setDateTo] = useState(() => periodAround("month", new Date()).to);

  const [tithes, setTithes] = useState<Tithe[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<GeneralFundSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Everything is computed client-side from one fetch: a church's records are small,
  // and the running balance needs every tithe and expense ever recorded anyway.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getTithes("0000-01-01", "9999-12-31"),
      getExpenses("0000-01-01", "9999-12-31"),
      getGeneralFundSettings(),
    ])
      .then(([tithesList, expensesList, s]) => {
        if (cancelled) return;
        setTithes(tithesList);
        setExpenses(expensesList);
        setSettings(s);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load finance report:", err);
        setError("Failed to load finance data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function applyPeriod(next: Exclude<FinancePeriodMode, "custom">, anchor: Date) {
    const r = periodAround(next, anchor);
    setMode(next);
    setDateFrom(r.from);
    setDateTo(r.to);
  }

  /** Switching to Month/Year keeps you near what you were looking at: the period's last
   *  day (or today, if the period runs past it). Custom keeps the current dates. */
  function chooseMode(next: FinancePeriodMode) {
    if (next === "custom") {
      setMode("custom");
      return;
    }
    applyPeriod(next, parseISO(dateTo < todayISO ? dateTo : todayISO));
  }

  /** ‹ › — previous / next month or year. */
  function stepPeriod(direction: -1 | 1) {
    if (mode === "custom") return;
    const from = parseISO(dateFrom);
    const anchor =
      mode === "month"
        ? new Date(from.getFullYear(), from.getMonth() + direction, 1)
        : new Date(from.getFullYear() + direction, 0, 1);
    applyPeriod(mode, anchor);
  }

  /** Jump back to the current month or year. */
  function goToCurrent() {
    applyPeriod(mode === "year" ? "year" : "month", new Date());
  }

  const currentPeriod = mode !== "custom" && dateFrom <= todayISO && todayISO <= dateTo;
  // Nothing has happened after the current month/year yet, so don't step into the future.
  const canStepForward = mode !== "custom" && dateTo < todayISO;

  /** From/To edits keep the range valid (From ≤ To). */
  function changeDateFrom(value: string) {
    if (!value) return;
    setDateFrom(value);
    if (value > dateTo) setDateTo(value);
  }
  function changeDateTo(value: string) {
    if (!value) return;
    setDateTo(value);
    if (value < dateFrom) setDateFrom(value);
  }

  /** Narrows the report to one month — used when a month is clicked in the chart or table. */
  function selectMonth(year: number, month: number) {
    applyPeriod("month", new Date(year, month, 1));
  }

  // The money on hand before anything was recorded in the app (Settings → General).
  const startingBalance = settings?.openingBalance ?? 0;
  // Saved at least once (even as ₱0) — dateModified is only written by saveGeneralFundSettings.
  const startingBalanceSet = Boolean(settings?.dateModified);

  /** General Fund balance as of the end of `asOf` (inclusive):
   *  starting balance + every tithe so far − every expense so far. */
  const balanceAsOf = useMemo(
    () => (asOf: string) =>
      startingBalance +
      sumAmounts(tithes.filter((t) => t.date <= asOf)) -
      sumAmounts(expenses.filter((e) => e.date <= asOf)),
    [tithes, expenses, startingBalance]
  );

  const report = useMemo(() => {
    const tithesIn = (from: string, to: string) => tithes.filter((t) => t.date >= from && t.date <= to);
    const expensesIn = (from: string, to: string) => expenses.filter((e) => e.date >= from && e.date <= to);

    const periodTithes = sumAmounts(tithesIn(dateFrom, dateTo));
    const periodExpenses = sumAmounts(expensesIn(dateFrom, dateTo));

    // Compare with the period of the same length right before this one.
    const lengthDays = Math.round((parseISO(dateTo).getTime() - parseISO(dateFrom).getTime()) / 86_400_000);
    const prevTo = addDays(dateFrom, -1);
    const prevFrom = addDays(prevTo, -lengthDays);
    const prevTithes = sumAmounts(tithesIn(prevFrom, prevTo));
    const changePct = prevTithes > 0 ? ((periodTithes - prevTithes) / prevTithes) * 100 : null;

    const toDate = parseISO(dateTo);
    const ytdTithes = sumAmounts(tithesIn(monthStartISO(toDate.getFullYear(), 0), dateTo));

    // Month rows: every month the period touches. A period inside one month shows that
    // month's whole year instead, so the chart still has context around it.
    const fromDate = parseISO(dateFrom);
    const singleMonth =
      fromDate.getFullYear() === toDate.getFullYear() && fromDate.getMonth() === toDate.getMonth();
    const rowsFrom = singleMonth ? new Date(fromDate.getFullYear(), 0, 1) : new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const rowsTo = singleMonth ? new Date(toDate.getFullYear(), 11, 1) : new Date(toDate.getFullYear(), toDate.getMonth(), 1);
    const multiYear = rowsFrom.getFullYear() !== rowsTo.getFullYear();

    const months: FinanceMonthRow[] = [];
    for (let d = new Date(rowsFrom); d <= rowsTo; d.setMonth(d.getMonth() + 1)) {
      const year = d.getFullYear();
      const month = d.getMonth();
      // Clip to the period, except in the single-month "whole year" view.
      const from = singleMonth ? monthStartISO(year, month) : [monthStartISO(year, month), dateFrom].sort()[1];
      const to = singleMonth ? monthEndISO(year, month) : [monthEndISO(year, month), dateTo].sort()[0];
      const monthTithes = sumAmounts(tithesIn(from, to));
      const monthExpenses = sumAmounts(expensesIn(from, to));
      const inFuture = from > todayISO;
      months.push({
        key: `${year}-${month}`,
        year,
        month,
        label: multiYear ? `${FINANCE_MONTHS_SHORT[month]} ${year}` : FINANCE_MONTHS_SHORT[month],
        tithes: monthTithes,
        expenses: monthExpenses,
        net: monthTithes - monthExpenses,
        balance: inFuture ? null : balanceAsOf(to < todayISO ? to : todayISO),
      });
    }

    const byDate = new Map<string, Tithe[]>();
    tithesIn(dateFrom, dateTo).forEach((t) => byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]));
    const sundays: FinanceSundayRow[] = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({
        date,
        givers: new Set(list.map((t) => t.memberId || `anon:${t.id}`)).size,
        total: sumAmounts(list),
      }));

    const byCategory = new Map<string, number>();
    expensesIn(dateFrom, dateTo).forEach((e) =>
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + (e.amount || 0))
    );
    const expenseCategories: FinanceCategoryRow[] = [...byCategory.entries()]
      .map(([category, total]) => ({
        category,
        total,
        pctOfTithes: periodTithes > 0 ? (total / periodTithes) * 100 : null,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      periodLabel: describePeriod(dateFrom, dateTo),
      ytdYear: toDate.getFullYear(),
      periodTithes,
      periodExpenses,
      changePct,
      ytdTithes,
      // Fund on hand going into the period (what earlier months left over), and what's
      // left once all of the period's tithes are in and its bills are paid.
      startBalance: balanceAsOf(addDays(dateFrom, -1)),
      endBalance: balanceAsOf(dateTo),
      months,
      selectedMonthKey: singleMonth ? `${fromDate.getFullYear()}-${fromDate.getMonth()}` : null,
      sundays,
      expenseCategories,
    };
  }, [tithes, expenses, dateFrom, dateTo, todayISO, balanceAsOf]);


  return {
    mode,
    chooseMode,
    stepPeriod,
    goToCurrent,
    currentPeriod,
    canStepForward,
    dateFrom,
    dateTo,
    changeDateFrom,
    changeDateTo,
    selectMonth,
    loading,
    error,

    fundBalance: balanceAsOf(todayISO),
    startingBalanceSet,

    ...report,
  };
}
