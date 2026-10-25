import { useEffect, useMemo, useState } from "react";
import { getGeneralFundSettings } from "../services/finance/financeSettingsService";
import { getTithes } from "../services/tithes/tithesService";
import { getExpenses } from "../services/expenses/expensesService";
import { getOfferings } from "../services/offerings/offeringsService";
import { getDepartmentFunds } from "../services/departments/departmentFundsService";
import { getDepartments } from "../services/departments/departmentsService";
import type { Department } from "../types/department";
import type { DepartmentFund } from "../types/departmentFund";
import type { Expense } from "../types/expense";
import type { GeneralFundSettings } from "../types/finance";
import type { Offering } from "../types/offering";
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
  offerings: number;
  expenses: number;
  /** Cash given to departments minus the unused cash they returned, this month. */
  departmentFunds: number;
  net: number; // tithes + offerings − expenses − department funds
  /** General Fund balance at the end of this month; null for months still in the future. */
  balance: number | null;
}

/** One service date (Sunday or Wednesday) and what came in that day. */
export interface FinanceServiceRow {
  date: string; // ISO
  givers: number; // members who gave tithes that day
  tithes: number;
  offerings: number;
  total: number;
}

/** One department's cash for the period: what it was given and what it returned. */
export interface FinanceDepartmentRow {
  departmentId: string;
  name: string;
  given: number;
  returned: number;
  net: number; // given − returned: what the General Fund lost to this department
}

export interface FinanceCategoryRow {
  category: string;
  total: number;
  /** Share of the period's income (tithes + offerings) this category used up; null when there was none. */
  pctOfIncome: number | null;
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
 * balance (starting balance + tithes + offerings − expenses − cash given to departments + unused
 * cash they returned), period KPIs, a month-by-month breakdown, per-service totals, expenses by
 * category and cash per department. Totals only — no per-member amounts, since individual giving
 * is private.
 */
export default function useFinanceReport() {
  const now = new Date();
  const todayISO = toLocalISODate(now);

  const [mode, setMode] = useState<FinancePeriodMode>("month");
  const [dateFrom, setDateFrom] = useState(() => periodAround("month", new Date()).from);
  const [dateTo, setDateTo] = useState(() => periodAround("month", new Date()).to);

  const [tithes, setTithes] = useState<Tithe[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [deptFunds, setDeptFunds] = useState<DepartmentFund[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [settings, setSettings] = useState<GeneralFundSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Everything is computed client-side from one fetch: a church's records are small,
  // and the running balance needs every tithe, offering, expense and department cash ever recorded anyway.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getTithes("0000-01-01", "9999-12-31"),
      getOfferings("0000-01-01", "9999-12-31"),
      getExpenses("0000-01-01", "9999-12-31"),
      getDepartmentFunds("0000-01-01", "9999-12-31"),
      getDepartments(),
      getGeneralFundSettings(),
    ])
      .then(([tithesList, offeringsList, expensesList, fundsList, departmentList, s]) => {
        if (cancelled) return;
        setTithes(tithesList);
        setOfferings(offeringsList);
        setExpenses(expensesList);
        setDeptFunds(fundsList);
        setDepartments(departmentList);
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

  /** Cash given to departments within [from, to] — it leaves the fund on the day it's given. */
  const deptGivenIn = useMemo(
    () => (from: string, to: string) =>
      deptFunds.reduce((s, f) => (f.dateGiven >= from && f.dateGiven <= to ? s + (f.amountGiven || 0) : s), 0),
    [deptFunds]
  );
  /** Unused cash departments returned within [from, to] — it comes back on the day it's returned. */
  const deptReturnedIn = useMemo(
    () => (from: string, to: string) =>
      deptFunds.reduce(
        (s, f) => (f.dateReturned && f.dateReturned >= from && f.dateReturned <= to ? s + (f.amountReturned || 0) : s),
        0
      ),
    [deptFunds]
  );

  /** General Fund balance as of the end of `asOf` (inclusive): starting balance
   *  + every tithe and offering so far − every expense so far − cash given to departments
   *  so far + unused cash they returned so far. */
  const balanceAsOf = useMemo(
    () => (asOf: string) =>
      startingBalance +
      sumAmounts(tithes.filter((t) => t.date <= asOf)) +
      sumAmounts(offerings.filter((o) => o.date <= asOf)) -
      sumAmounts(expenses.filter((e) => e.date <= asOf)) -
      deptGivenIn("0000-01-01", asOf) +
      deptReturnedIn("0000-01-01", asOf),
    [tithes, offerings, expenses, startingBalance, deptGivenIn, deptReturnedIn]
  );

  const report = useMemo(() => {
    const inRange = (from: string, to: string) => (r: { date: string }) => r.date >= from && r.date <= to;
    const tithesIn = (from: string, to: string) => tithes.filter(inRange(from, to));
    const offeringsIn = (from: string, to: string) => offerings.filter(inRange(from, to));
    const expensesIn = (from: string, to: string) => expenses.filter(inRange(from, to));
    const incomeIn = (from: string, to: string) => sumAmounts(tithesIn(from, to)) + sumAmounts(offeringsIn(from, to));

    const periodTithes = sumAmounts(tithesIn(dateFrom, dateTo));
    const periodOfferings = sumAmounts(offeringsIn(dateFrom, dateTo));
    const periodIncome = periodTithes + periodOfferings;
    const periodExpenses = sumAmounts(expensesIn(dateFrom, dateTo));
    const periodDeptGiven = deptGivenIn(dateFrom, dateTo);
    const periodDeptReturned = deptReturnedIn(dateFrom, dateTo);

    // Compare with the period of the same length right before this one.
    const lengthDays = Math.round((parseISO(dateTo).getTime() - parseISO(dateFrom).getTime()) / 86_400_000);
    const prevTo = addDays(dateFrom, -1);
    const prevFrom = addDays(prevTo, -lengthDays);
    const prevIncome = incomeIn(prevFrom, prevTo);
    const changePct = prevIncome > 0 ? ((periodIncome - prevIncome) / prevIncome) * 100 : null;

    const toDate = parseISO(dateTo);
    const ytdIncome = incomeIn(monthStartISO(toDate.getFullYear(), 0), dateTo);

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
      const monthOfferings = sumAmounts(offeringsIn(from, to));
      const monthExpenses = sumAmounts(expensesIn(from, to));
      const monthDeptFunds = deptGivenIn(from, to) - deptReturnedIn(from, to);
      const inFuture = from > todayISO;
      months.push({
        key: `${year}-${month}`,
        year,
        month,
        label: multiYear ? `${FINANCE_MONTHS_SHORT[month]} ${year}` : FINANCE_MONTHS_SHORT[month],
        tithes: monthTithes,
        offerings: monthOfferings,
        expenses: monthExpenses,
        departmentFunds: monthDeptFunds,
        net: monthTithes + monthOfferings - monthExpenses - monthDeptFunds,
        balance: inFuture ? null : balanceAsOf(to < todayISO ? to : todayISO),
      });
    }

    // Per-service collections: every date with tithes and/or an offering.
    const tithesByDate = new Map<string, Tithe[]>();
    tithesIn(dateFrom, dateTo).forEach((t) => tithesByDate.set(t.date, [...(tithesByDate.get(t.date) ?? []), t]));
    const offeringByDate = new Map<string, number>();
    offeringsIn(dateFrom, dateTo).forEach((o) => offeringByDate.set(o.date, (offeringByDate.get(o.date) ?? 0) + (o.amount || 0)));
    const services: FinanceServiceRow[] = [...new Set([...tithesByDate.keys(), ...offeringByDate.keys()])]
      .sort()
      .map((date) => {
        const list = tithesByDate.get(date) ?? [];
        const dayTithes = sumAmounts(list);
        const dayOfferings = offeringByDate.get(date) ?? 0;
        return {
          date,
          givers: new Set(list.map((t) => t.memberId || `anon:${t.id}`)).size,
          tithes: dayTithes,
          offerings: dayOfferings,
          total: dayTithes + dayOfferings,
        };
      });

    const byCategory = new Map<string, number>();
    expensesIn(dateFrom, dateTo).forEach((e) =>
      byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + (e.amount || 0))
    );
    const expenseCategories: FinanceCategoryRow[] = [...byCategory.entries()]
      .map(([category, total]) => ({
        category,
        total,
        pctOfIncome: periodIncome > 0 ? (total / periodIncome) * 100 : null,
      }))
      .sort((a, b) => b.total - a.total);

    // Cash per department: given in the period, and unused cash returned in the period.
    const departmentNames = new Map(departments.map((d) => [d.id, d.name]));
    const byDepartment = new Map<string, { given: number; returned: number }>();
    const deptTotals = (id: string) => {
      let row = byDepartment.get(id);
      if (!row) byDepartment.set(id, (row = { given: 0, returned: 0 }));
      return row;
    };
    deptFunds.forEach((f) => {
      if (f.dateGiven >= dateFrom && f.dateGiven <= dateTo) deptTotals(f.departmentId).given += f.amountGiven || 0;
      if (f.dateReturned && f.dateReturned >= dateFrom && f.dateReturned <= dateTo) {
        deptTotals(f.departmentId).returned += f.amountReturned || 0;
      }
    });
    const departmentRows: FinanceDepartmentRow[] = [...byDepartment.entries()]
      .map(([departmentId, { given, returned }]) => ({
        departmentId,
        name: departmentNames.get(departmentId) ?? "Unknown department",
        given,
        returned,
        net: given - returned,
      }))
      .sort((a, b) => b.net - a.net);

    return {
      periodLabel: describePeriod(dateFrom, dateTo),
      ytdYear: toDate.getFullYear(),
      periodTithes,
      periodOfferings,
      periodIncome,
      periodExpenses,
      periodDeptGiven,
      periodDeptReturned,
      changePct,
      ytdIncome,
      // Fund on hand going into the period (what earlier months left over), and what's
      // left once all of the period's tithes and offerings are in, its bills are paid and
      // its department cash is given out (less what came back).
      startBalance: balanceAsOf(addDays(dateFrom, -1)),
      endBalance: balanceAsOf(dateTo),
      months,
      selectedMonthKey: singleMonth ? `${fromDate.getFullYear()}-${fromDate.getMonth()}` : null,
      services,
      expenseCategories,
      departmentRows,
    };
  }, [tithes, offerings, expenses, deptFunds, departments, dateFrom, dateTo, todayISO, balanceAsOf, deptGivenIn, deptReturnedIn]);


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
    // Department lines stay hidden for a church that has never given cash to a department.
    hasDepartmentFunds: deptFunds.length > 0,

    ...report,
  };
}
