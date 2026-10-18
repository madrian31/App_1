import { useEffect, useMemo, useState } from "react";
import { getGeneralFundSettings, saveGeneralFundSettings } from "../services/finance/financeSettingsService";
import { getTithes } from "../services/tithes/tithesService";
import type { GeneralFundSettings } from "../types/finance";
import type { Tithe } from "../types/tithe";
import { toLocalISODate } from "../utils/date";

export const FINANCE_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
export const FINANCE_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Expenses aren't recorded anywhere yet — the Electricity / Internet / Water pages
 * are still "Coming Soon". Every expense figure in the report reads through this
 * so wiring them up later is a one-place change.
 */
export const EXPENSES_AVAILABLE = false;
const expensesBetween: (dateFrom: string, dateTo: string) => number = () => 0;

export interface FinanceMonthRow {
  month: number; // 0–11
  label: string; // "Jan"
  tithes: number;
  expenses: number;
  net: number;
  /** General Fund balance at the end of this month; null before the opening date or in the future. */
  balance: number | null;
}

export interface FinanceSundayRow {
  date: string; // ISO
  givers: number;
  total: number;
}

function monthStartISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month, 1));
}
function monthEndISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month + 1, 0));
}

function sumAmounts(list: Tithe[]): number {
  return list.reduce((s, t) => s + (t.amount || 0), 0);
}

/**
 * Drives the Finance Report: the General Fund balance (opening balance + tithes − expenses),
 * month KPIs, a 12-month breakdown for the selected year, and per-Sunday totals for the
 * selected month. Totals only — no per-member amounts, since individual giving is private.
 */
export default function useFinanceReport(currentUser: string) {
  const now = new Date();
  const todayISO = toLocalISODate(now);

  const [curYear, setCurYear] = useState(now.getFullYear());
  const [curMonth, setCurMonth] = useState(now.getMonth());

  const [tithes, setTithes] = useState<Tithe[]>([]);
  const [settings, setSettings] = useState<GeneralFundSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showOpeningForm, setShowOpeningForm] = useState(false);
  const [savingOpening, setSavingOpening] = useState(false);

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 5 + i);

  // Everything is computed client-side from one fetch: a church's tithe records are
  // small, and the running balance needs every tithe since the opening date anyway.
  useEffect(() => {
    let cancelled = false;
    Promise.all([getTithes("0000-01-01", "9999-12-31"), getGeneralFundSettings()])
      .then(([list, s]) => {
        if (cancelled) return;
        setTithes(list);
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

  const openingBalance = settings?.openingBalance ?? 0;
  const openingDate = settings?.openingDate ?? "";

  /** General Fund balance as of the end of `dateTo` (inclusive). */
  const balanceAsOf = useMemo(() => {
    const counted = tithes.filter((t) => !openingDate || t.date >= openingDate);
    return (dateTo: string) =>
      openingBalance +
      sumAmounts(counted.filter((t) => t.date <= dateTo)) -
      expensesBetween(openingDate || "0000-01-01", dateTo);
  }, [tithes, openingBalance, openingDate]);

  const report = useMemo(() => {
    const between = (from: string, to: string) => tithes.filter((t) => t.date >= from && t.date <= to);

    const monthFrom = monthStartISO(curYear, curMonth);
    const monthTo = monthEndISO(curYear, curMonth);
    const prev = new Date(curYear, curMonth - 1, 1);
    const prevFrom = monthStartISO(prev.getFullYear(), prev.getMonth());
    const prevTo = monthEndISO(prev.getFullYear(), prev.getMonth());

    const monthTithes = sumAmounts(between(monthFrom, monthTo));
    const prevMonthTithes = sumAmounts(between(prevFrom, prevTo));
    const monthChangePct = prevMonthTithes > 0 ? ((monthTithes - prevMonthTithes) / prevMonthTithes) * 100 : null;

    const ytdTithes = sumAmounts(between(monthStartISO(curYear, 0), monthTo));

    const months: FinanceMonthRow[] = FINANCE_MONTHS_SHORT.map((label, month) => {
      const from = monthStartISO(curYear, month);
      const to = monthEndISO(curYear, month);
      const monthTotal = sumAmounts(between(from, to));
      const expenses = expensesBetween(from, to);
      const beforeOpening = Boolean(openingDate) && to < openingDate;
      const inFuture = from > todayISO;
      return {
        month,
        label,
        tithes: monthTotal,
        expenses,
        net: monthTotal - expenses,
        balance: beforeOpening || inFuture ? null : balanceAsOf(to < todayISO ? to : todayISO),
      };
    });

    const byDate = new Map<string, Tithe[]>();
    between(monthFrom, monthTo).forEach((t) => byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]));
    const sundays: FinanceSundayRow[] = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, list]) => ({
        date,
        givers: new Set(list.map((t) => t.memberId || `anon:${t.id}`)).size,
        total: sumAmounts(list),
      }));

    return {
      monthTithes,
      prevMonthTithes,
      monthChangePct,
      monthExpenses: expensesBetween(monthFrom, monthTo),
      ytdTithes,
      yearTithes: sumAmounts(between(monthStartISO(curYear, 0), monthEndISO(curYear, 11))),
      months,
      sundays,
    };
  }, [tithes, curYear, curMonth, openingDate, todayISO, balanceAsOf]);

  async function saveOpening(amount: number, date: string) {
    setSavingOpening(true);
    setError(null);
    try {
      setSettings(await saveGeneralFundSettings(amount, date, currentUser));
      setShowOpeningForm(false);
    } catch (err) {
      console.error("Failed to save opening balance:", err);
      setError("Failed to save opening balance.");
    } finally {
      setSavingOpening(false);
    }
  }

  return {
    curYear,
    setCurYear,
    curMonth,
    setCurMonth,
    years,
    loading,
    error,

    fundBalance: balanceAsOf(todayISO),
    openingBalance,
    openingDate,

    showOpeningForm,
    setShowOpeningForm,
    savingOpening,
    saveOpening,

    ...report,
  };
}
