import { useEffect, useMemo, useState } from "react";
import { getDepartments } from "../services/departments/departmentsService";
import {
  addDepartmentFund,
  deleteDepartmentFund,
  getDepartmentFunds,
  updateDepartmentFund,
} from "../services/departments/departmentFundsService";
import * as calendarEventsService from "../services/calendar/calendarEventsService";
import type { CalendarEvent } from "../types/calendarEvent";
import type { Department } from "../types/department";
import {
  isOverAccounted,
  liquidationStatus,
  unliquidatedAmount,
  type DepartmentFund,
  type LiquidationStatus,
  type NewDepartmentFund,
} from "../types/departmentFund";
import { MONTHS } from "../types/calendarEvent";
import { groupActivities, type DepartmentActivity } from "../utils/departmentActivities";
import { formatDisplayDate, toLocalISODate } from "../utils/date";
import { fmtPeso } from "../components/finance/financeFormat";
import useAutoSave from "./useAutoSave";

export const ALL_DEPARTMENTS = "";
/** The form's activity choice for budget that isn't for anything in the Calendar. */
export const OTHER_ACTIVITY = "__other";

/** Activities list: the page's whole year, one month of it, or any From/To dates. */
export type ActivityPeriod = "year" | "month" | "custom";
export const ACTIVITY_PERIODS: { value: ActivityPeriod; label: string }[] = [
  { value: "year", label: "Whole Year" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];
export const ACTIVITIES_PER_PAGE = 5;

export interface DepartmentFundForm {
  departmentId: string;
  eventId: string; // the calendar activity it's for; "" when none
  /** Picked "Other — not in the Calendar" on purpose; only then is `purpose` typed in. */
  notInCalendar: boolean;
  purpose: string;
  receivedBy: string;
  amountGiven: string;
  dateGiven: string; // ISO date
  amountSpent: string;
  amountReturned: string;
  dateReturned: string; // ISO date, "" when nothing was returned
  notes: string;
}

/** A calendar activity with the budget given for it so far. */
export interface ActivityRow extends DepartmentActivity {
  given: number;
  returned: number;
  unliquidated: number;
  fundCount: number;
  status: LiquidationStatus | "none"; // "none" = no budget given yet
}

/** One department's year: its activities' allocated budgets against the budget it actually kept. */
export interface DepartmentSummaryRow {
  departmentId: string;
  name: string;
  isActive: boolean;
  budget: number; // total allocated budget of its activities this year
  given: number;
  returned: number;
  used: number; // given − returned: what the General Fund actually lost to this department
  remaining: number; // budget − used; negative when over budget
  unliquidated: number; // budget given that still has to be accounted for
}

function emptyForm(departmentId = ""): DepartmentFundForm {
  return {
    departmentId,
    eventId: "",
    notInCalendar: false,
    purpose: "",
    receivedBy: "",
    amountGiven: "",
    dateGiven: toLocalISODate(new Date()),
    amountSpent: "",
    amountReturned: "",
    dateReturned: "",
    notes: "",
  };
}

const num = (s: string) => parseFloat(s) || 0;
const yearOf = (iso: string) => Number(iso.slice(0, 4));
const monthStart = (y: number, m: number) => toLocalISODate(new Date(y, m, 1));
const monthEnd = (y: number, m: number) => toLocalISODate(new Date(y, m + 1, 0));
const net = (f: Pick<DepartmentFund, "amountGiven" | "amountReturned">) => f.amountGiven - f.amountReturned;

/**
 * Drives Finance → Department Funds for one year: the departments' calendar activities and
 * their allocated budgets (edited here, saved on their own), each department's budget vs what it
 * was given, the list of budget given, and the Add Budget / liquidation form.
 *
 * Budget given for an activity belongs to the activity's year, even when it was handed out the
 * December before; budget given for nothing in the Calendar belongs to the year it was given.
 */
export default function useDepartmentFunds(currentUser: string) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [departmentFilter, setDepartmentFilter] = useState(ALL_DEPARTMENTS);
  const [search, setSearch] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [funds, setFunds] = useState<DepartmentFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autoSave = useAutoSave();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DepartmentFundForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const years = [...new Set([...Array.from({ length: 5 }, (_, i) => now.getFullYear() - 3 + i), year])].sort();

  // Everything is loaded once and filtered here: a church's records are small, and an
  // activity's budget can be given in a different year than the activity.
  useEffect(() => {
    Promise.all([getDepartments(), calendarEventsService.getAllEvents(), getDepartmentFunds("0000-01-01", "9999-12-31")])
      .then(([departmentList, eventList, fundList]) => {
        setDepartments(departmentList);
        setEvents(eventList);
        setFunds(fundList);
      })
      .catch((err) => {
        console.error("Failed to load department funds:", err);
        setError("Failed to load department funds.");
      })
      .finally(() => setLoading(false));
  }, []);

  async function reloadFunds() {
    try {
      setFunds(await getDepartmentFunds("0000-01-01", "9999-12-31"));
    } catch (err) {
      console.error("Failed to reload department funds:", err);
      setError("Failed to load department funds.");
    }
  }

  const departmentName = useMemo(() => {
    const byId = new Map(departments.map((d) => [d.id, d.name]));
    return (id: string) => (id ? byId.get(id) ?? "Unknown department" : "No department");
  }, [departments]);

  // ── Activities ──

  const activities = useMemo(() => groupActivities(events, departments), [events, departments]);
  const activityOfEvent = useMemo(() => {
    const map = new Map<string, DepartmentActivity>();
    activities.forEach((a) => a.eventIds.forEach((id) => map.set(id, a)));
    return map;
  }, [activities]);

  const budgetYearOf = useMemo(
    () => (f: Pick<DepartmentFund, "eventId" | "dateGiven">) => {
      const a = f.eventId ? activityOfEvent.get(f.eventId) : undefined;
      return a ? yearOf(a.dateFrom) : yearOf(f.dateGiven);
    },
    [activityOfEvent]
  );

  const yearActivities = useMemo(() => activities.filter((a) => yearOf(a.dateFrom) === year), [activities, year]);
  const yearFunds = useMemo(() => funds.filter((f) => budgetYearOf(f) === year), [funds, budgetYearOf, year]);

  /** Every activity with the budget given for it so far. */
  const activityRows = useMemo<ActivityRow[]>(() => {
    const fundsByActivity = new Map<string, DepartmentFund[]>();
    funds.forEach((f) => {
      const a = f.eventId ? activityOfEvent.get(f.eventId) : undefined;
      if (a) fundsByActivity.set(a.key, [...(fundsByActivity.get(a.key) ?? []), f]);
    });
    return activities.map((a) => {
      const linked = fundsByActivity.get(a.key) ?? [];
      const allDone = linked.every((f) => liquidationStatus(f) === "done");
      const anyStarted = linked.some((f) => liquidationStatus(f) !== "pending");
      return {
        ...a,
        given: linked.reduce((s, f) => s + f.amountGiven, 0),
        returned: linked.reduce((s, f) => s + f.amountReturned, 0),
        unliquidated: linked.reduce((s, f) => s + unliquidatedAmount(f), 0),
        fundCount: linked.length,
        status: linked.length === 0 ? "none" : allDone ? "done" : anyStarted ? "partial" : "pending",
      };
    });
  }, [activities, funds, activityOfEvent]);

  // ── Which activities are listed: a period (the year, one month of it, or From/To), then 5 per page ──

  const [activityPeriod, setActivityPeriodState] = useState<ActivityPeriod>("year");
  const [activityMonth, setActivityMonthState] = useState(now.getMonth());
  const [activityFrom, setActivityFromState] = useState(() => monthStart(now.getFullYear(), now.getMonth()));
  const [activityTo, setActivityToState] = useState(() => monthEnd(now.getFullYear(), now.getMonth()));
  const [activityPage, setActivityPage] = useState(1);

  const periodRange =
    activityPeriod === "month"
      ? { from: monthStart(year, activityMonth), to: monthEnd(year, activityMonth) }
      : activityPeriod === "custom"
        ? { from: activityFrom, to: activityTo }
        : { from: `${year}-01-01`, to: `${year}-12-31` };

  const activityPeriodLabel =
    activityPeriod === "month"
      ? `${MONTHS[activityMonth]} ${year}`
      : activityPeriod === "custom"
        ? activityFrom === activityTo
          ? formatDisplayDate(activityFrom)
          : `${formatDisplayDate(activityFrom)} – ${formatDisplayDate(activityTo)}`
        : String(year);

  const periodRows = useMemo(
    () =>
      activityRows.filter((a) =>
        // The year lists what counts toward its budget (activities that start in it); a month or
        // From/To also lists an activity that runs into it from before.
        activityPeriod === "year"
          ? yearOf(a.dateFrom) === year
          : a.dateFrom <= periodRange.to && a.dateTo >= periodRange.from
      ),
    [activityRows, activityPeriod, year, periodRange.from, periodRange.to]
  );

  const visibleActivities = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodRows.filter(
      (a) =>
        // By default only what concerns a department: it has one, a budget, or budget given.
        (showAllActivities || a.departmentId || a.budget !== null || a.fundCount > 0) &&
        (!departmentFilter || a.departmentId === departmentFilter) &&
        (!q || [a.title, a.inCharge, a.location].some((t) => t.toLowerCase().includes(q)))
    );
  }, [periodRows, showAllActivities, departmentFilter, search]);

  const activityTotalPages = Math.max(1, Math.ceil(visibleActivities.length / ACTIVITIES_PER_PAGE));
  const activitySafePage = Math.min(activityPage, activityTotalPages);
  const activityStart = (activitySafePage - 1) * ACTIVITIES_PER_PAGE;
  const pagedActivities = visibleActivities.slice(activityStart, activityStart + ACTIVITIES_PER_PAGE);

  // Any change to what's listed goes back to the first page.
  const firstPage = () => setActivityPage(1);
  function setActivityPeriod(next: ActivityPeriod) {
    setActivityPeriodState(next);
    // A month view starts on this month in the current year, otherwise on January.
    if (next === "month") setActivityMonthState(year === now.getFullYear() ? now.getMonth() : 0);
    if (next === "custom" && activityPeriod !== "custom") {
      setActivityFromState(periodRange.from);
      setActivityToState(periodRange.to);
    }
    firstPage();
  }
  function setActivityMonth(month: number) {
    setActivityMonthState(month);
    firstPage();
  }
  /** From/To edits keep the range valid (From ≤ To). */
  function setActivityFrom(value: string) {
    if (!value) return;
    setActivityFromState(value);
    if (value > activityTo) setActivityToState(value);
    firstPage();
  }
  function setActivityTo(value: string) {
    if (!value) return;
    setActivityToState(value);
    if (value < activityFrom) setActivityFromState(value);
    firstPage();
  }

  /** Activities with an allocated budget but no department yet — their budget isn't counted for any department. */
  const unassignedBudgetCount = activityRows.filter(
    (a) => yearOf(a.dateFrom) === year && !a.departmentId && (a.budget ?? 0) > 0
  ).length;

  function setActivityDepartment(a: DepartmentActivity, departmentId: string) {
    if (departmentId === a.departmentId && a.departmentSource !== "matched") return;
    const ids = a.eventIds;
    setEvents((list) => list.map((e) => (ids.includes(e.id) ? { ...e, departmentId } : e)));
    autoSave.save(`${a.key}:department`, async () => {
      await Promise.all(ids.map((id) => calendarEventsService.updateEvent(id, { departmentId })));
    });
  }

  /** Returns false when there's nothing to save, so the field shows the saved value again. */
  function setActivityBudget(a: DepartmentActivity, raw: string): boolean {
    const amount = raw.trim() === "" ? 0 : Math.round(parseFloat(raw) * 100) / 100;
    if (!Number.isFinite(amount) || amount < 0) return false;
    if (amount === (a.budget ?? 0)) return false;
    const ids = a.eventIds;
    setEvents((list) => list.map((e) => (ids.includes(e.id) ? { ...e, allocatedBudget: amount } : e)));
    autoSave.save(`${a.key}:budget`, async () => {
      await Promise.all(ids.map((id) => calendarEventsService.updateEvent(id, { allocatedBudget: amount })));
    });
    return true;
  }

  // ── Form ──

  function openAddForm() {
    // Pre-pick the filtered department — adding Youth's budget while viewing Youth is the common case.
    setForm(emptyForm(departmentFilter));
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  /** Add Budget for one activity: department, activity and the budget still left are filled in. */
  function openAddForActivity(a: ActivityRow) {
    const left = (a.budget ?? 0) - (a.given - a.returned);
    setForm({
      ...emptyForm(a.departmentId),
      eventId: a.key,
      purpose: a.title,
      amountGiven: left > 0 ? String(Math.round(left * 100) / 100) : "",
    });
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(fund: DepartmentFund) {
    setForm({
      departmentId: fund.departmentId,
      eventId: fund.eventId,
      notInCalendar: !fund.eventId,
      purpose: fund.purpose,
      receivedBy: fund.receivedBy,
      amountGiven: String(fund.amountGiven),
      dateGiven: fund.dateGiven,
      amountSpent: fund.amountSpent ? String(fund.amountSpent) : "",
      amountReturned: fund.amountReturned ? String(fund.amountReturned) : "",
      dateReturned: fund.dateReturned,
      notes: fund.notes,
    });
    setEditingId(fund.id);
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  /** What the budget is for: a calendar activity's key, OTHER_ACTIVITY, or "" (not chosen yet). */
  function chooseActivity(choice: string) {
    setForm((f) => {
      if (choice === OTHER_ACTIVITY) {
        // Keep a typed purpose, but not one copied from an activity.
        const fromActivity = f.eventId ? activityOfEvent.get(f.eventId)?.title === f.purpose : false;
        return { ...f, eventId: "", notInCalendar: true, purpose: fromActivity ? "" : f.purpose };
      }
      const activity = choice ? activityOfEvent.get(choice) : undefined;
      if (!activity) return { ...f, eventId: "", notInCalendar: false };
      // Suggest what's left of its budget when no amount has been typed yet.
      const left = activityBudgetLeft(activity, editingId);
      return {
        ...f,
        eventId: activity.key,
        notInCalendar: false,
        purpose: activity.title,
        amountGiven: !f.amountGiven && left !== null && left > 0 ? String(Math.round(left * 100) / 100) : f.amountGiven,
      };
    });
  }

  function updateForm<K extends keyof DepartmentFundForm>(key: K, value: DepartmentFundForm[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "departmentId" && f.eventId) {
        // An activity of another department no longer fits.
        const linked = activityOfEvent.get(f.eventId);
        if (linked && linked.departmentId && linked.departmentId !== value) next.eventId = "";
      }
      // Returned budget needs a date — default to today the first time an amount is typed.
      if (key === "amountReturned" && num(String(value)) > 0 && !f.dateReturned) next.dateReturned = toLocalISODate(new Date());
      return next;
    });
  }

  /** Allocated budget minus what was already given for it (less returns), leaving out one entry being edited.
   *  null when the activity has no allocated budget. */
  function activityBudgetLeft(activity: DepartmentActivity, exceptFundId: string | null): number | null {
    if (activity.budget === null) return null;
    const used = funds
      .filter((f) => f.id !== exceptFundId && f.eventId && activity.eventIds.includes(f.eventId))
      .reduce((s, f) => s + net(f), 0);
    return activity.budget - used;
  }

  /** Activities to pick in the form this year: the chosen department's, and those with no department yet
   *  (picking one gives it this department). The linked activity is always kept. */
  const formActivities = useMemo(() => {
    const own = form.departmentId ? yearActivities.filter((a) => a.departmentId === form.departmentId) : [];
    const unassigned = form.departmentId ? yearActivities.filter((a) => !a.departmentId) : [];
    const linked = form.eventId ? activityOfEvent.get(form.eventId) : undefined;
    const withLinked = linked && !own.includes(linked) && !unassigned.includes(linked) ? [linked, ...own] : own;
    return { own: withLinked, unassigned };
  }, [yearActivities, form.departmentId, form.eventId, activityOfEvent]);

  /** The chosen activity's budget picture, shown in the form. */
  const formActivityInfo = (() => {
    const activity = form.eventId ? activityOfEvent.get(form.eventId) : undefined;
    if (!activity) return null;
    const left = activityBudgetLeft(activity, editingId);
    return {
      title: activity.title,
      dateFrom: activity.dateFrom,
      dateTo: activity.dateTo,
      budget: activity.budget,
      givenSoFar: activity.budget === null || left === null ? null : activity.budget - left,
      left,
      noDepartmentYet: !activity.departmentId,
    };
  })();

  const formAmounts = {
    amountGiven: num(form.amountGiven),
    amountSpent: num(form.amountSpent),
    amountReturned: num(form.amountReturned),
  };
  const formUnliquidated = unliquidatedAmount(formAmounts);

  /** Why the form can't be saved, when it's something the user must fix (not just an empty field). */
  const formProblem: string | null = (() => {
    if (formAmounts.amountSpent < 0 || formAmounts.amountReturned < 0) return "Amounts can't be less than zero.";
    if (formAmounts.amountGiven > 0 && isOverAccounted(formAmounts)) {
      return "Amount spent plus unused budget returned can't be more than the amount given. If the department spent more than it was given, add the extra with Add Budget.";
    }
    if (formAmounts.amountReturned > 0 && form.dateReturned && form.dateReturned < form.dateGiven) {
      return "The date returned can't be before the date the budget was given.";
    }
    return null;
  })();

  const canSave =
    Boolean(form.departmentId) &&
    // Every budget says where the money goes: a calendar activity, or — only when picked on purpose — a typed purpose.
    (form.eventId ? Boolean(activityOfEvent.get(form.eventId)) : form.notInCalendar && Boolean(form.purpose.trim())) &&
    formAmounts.amountGiven > 0 &&
    Boolean(form.dateGiven) &&
    (formAmounts.amountReturned === 0 || Boolean(form.dateReturned)) &&
    !formProblem;

  /** A heads-up (never blocking) when this goes past the activity's — or the department's — allocated budget. */
  const budgetWarning: string | null = (() => {
    if (!form.departmentId || formAmounts.amountGiven <= 0 || !form.dateGiven || loading) return null;
    const thisNet = formAmounts.amountGiven - formAmounts.amountReturned;
    const others = funds.filter((f) => f.id !== editingId);

    const activity = form.eventId ? activityOfEvent.get(form.eventId) : undefined;
    if (activity) {
      const left = activityBudgetLeft(activity, editingId);
      if (left === null || (activity.budget ?? 0) <= 0) {
        return `No allocated budget has been set for ${activity.title} yet. You can set it in the Activities list.`;
      }
      const over = thisNet - left;
      return over > 0.004
        ? `This is ${fmtPeso(over)} more than the allocated budget for ${activity.title} (${fmtPeso(activity.budget ?? 0)}).`
        : null;
    }

    const budgetYear = yearOf(form.dateGiven);
    const name = departmentName(form.departmentId);
    const budget = activities
      .filter((a) => a.departmentId === form.departmentId && yearOf(a.dateFrom) === budgetYear)
      .reduce((s, a) => s + (a.budget ?? 0), 0);
    if (budget <= 0) return `${name} has no allocated budget for ${budgetYear} yet.`;
    const used = others
      .filter((f) => f.departmentId === form.departmentId && budgetYearOf(f) === budgetYear)
      .reduce((s, f) => s + net(f), 0);
    const over = used + thisNet - budget;
    return over > 0.004
      ? `This is ${fmtPeso(over)} more than the ${budgetYear} allocated budget of ${name} (${fmtPeso(budget)}).`
      : null;
  })();

  async function saveEntry() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const activity = form.eventId ? activityOfEvent.get(form.eventId) : undefined;
      // An activity picked from "no department yet" now belongs to this department.
      if (activity && !activity.departmentId) {
        const departmentId = form.departmentId;
        await Promise.all(activity.eventIds.map((id) => calendarEventsService.updateEvent(id, { departmentId })));
        setEvents((list) => list.map((e) => (activity.eventIds.includes(e.id) ? { ...e, departmentId } : e)));
      }

      const payload: NewDepartmentFund = {
        departmentId: form.departmentId,
        eventId: activity ? activity.key : "",
        purpose: activity ? activity.title : form.purpose.trim(),
        receivedBy: form.receivedBy.trim(),
        amountGiven: formAmounts.amountGiven,
        dateGiven: form.dateGiven,
        amountSpent: formAmounts.amountSpent,
        amountReturned: formAmounts.amountReturned,
        dateReturned: formAmounts.amountReturned > 0 ? form.dateReturned : "",
        notes: form.notes.trim(),
        addedBy: currentUser,
      };
      if (editingId) await updateDepartmentFund(editingId, payload);
      else await addDepartmentFund(payload);

      // Jump to the year it belongs to so it doesn't seem to "disappear".
      const savedYear = budgetYearOf(payload);
      closeForm();
      await reloadFunds();
      if (savedYear !== year) setYear(savedYear);
    } catch (err) {
      console.error("Failed to save department budget:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    try {
      await deleteDepartmentFund(id);
      setDeleteConfirmId(null);
      setFunds((list) => list.filter((f) => f.id !== id));
    } catch (err) {
      console.error("Failed to delete department budget:", err);
      setError("Failed to delete.");
    }
  }

  // ── Budget given list & totals ──

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return yearFunds
      .filter(
        (f) =>
          (!departmentFilter || f.departmentId === departmentFilter) &&
          (!q || f.purpose.toLowerCase().includes(q) || f.receivedBy.toLowerCase().includes(q))
      )
      .sort((a, b) => b.dateGiven.localeCompare(a.dateGiven)); // newest first
  }, [yearFunds, departmentFilter, search]);

  const summaryRows = useMemo<DepartmentSummaryRow[]>(() => {
    const known = new Set(departments.map((d) => d.id));
    // Inactive departments still show for a year they had a budget or budget given.
    const rows = departments
      .map((d) => ({ id: d.id, name: d.name, isActive: d.isActive }))
      .concat(
        [...new Set(yearFunds.map((f) => f.departmentId))]
          .filter((id) => !known.has(id))
          .map((id) => ({ id, name: departmentName(id), isActive: false }))
      )
      .map((d): DepartmentSummaryRow => {
        const list = yearFunds.filter((f) => f.departmentId === d.id);
        const given = list.reduce((s, f) => s + f.amountGiven, 0);
        const returned = list.reduce((s, f) => s + f.amountReturned, 0);
        const budget = yearActivities.filter((a) => a.departmentId === d.id).reduce((s, a) => s + (a.budget ?? 0), 0);
        return {
          departmentId: d.id,
          name: d.name,
          isActive: d.isActive,
          budget,
          given,
          returned,
          used: given - returned,
          remaining: budget - (given - returned),
          unliquidated: list.reduce((s, f) => s + unliquidatedAmount(f), 0),
        };
      });
    return rows.filter((r) => r.isActive || r.budget > 0 || r.given > 0);
  }, [departments, yearFunds, yearActivities, departmentName]);

  const totals = useMemo(() => {
    const sum = (key: "budget" | "given" | "returned" | "used" | "unliquidated") =>
      summaryRows.reduce((s, r) => s + r[key], 0);
    return {
      totalBudget: sum("budget"),
      totalGiven: sum("given"),
      totalReturned: sum("returned"),
      totalUsed: sum("used"),
      totalUnliquidated: sum("unliquidated"),
      pendingCount: yearFunds.filter((f) => unliquidatedAmount(f) > 0).length,
    };
  }, [summaryRows, yearFunds]);

  /** Departments to pick from: active ones, plus the entry's own department if it was made inactive later. */
  const formDepartments = departments.filter((d) => d.isActive || d.id === form.departmentId);

  return {
    year,
    setYear: (y: number) => {
      setYear(y);
      firstPage();
    },
    years,
    departmentFilter,
    setDepartmentFilter: (id: string) => {
      setDepartmentFilter(id);
      firstPage();
    },
    search,
    setSearch: (q: string) => {
      setSearch(q);
      firstPage();
    },

    departments,
    formDepartments,
    departmentName,
    loading,
    error,

    activities: pagedActivities,
    activityMatchCount: visibleActivities.length, // after filters, before paging
    activityCount: periodRows.length, // every calendar activity in the period
    showAllActivities,
    setShowAllActivities: (show: boolean) => {
      setShowAllActivities(show);
      firstPage();
    },
    activityPeriod,
    setActivityPeriod,
    activityPeriodLabel,
    activityMonth,
    setActivityMonth,
    activityFrom,
    setActivityFrom,
    activityTo,
    setActivityTo,
    activityPage: activitySafePage,
    activityTotalPages,
    activityStart,
    goToActivityPage: (page: number) => setActivityPage(Math.min(Math.max(page, 1), activityTotalPages)),
    unassignedBudgetCount,
    setActivityDepartment,
    setActivityBudget,
    activitySaveStatus: autoSave.status,
    retryActivitySaves: autoSave.retryFailed,

    entries: filteredEntries,
    summaryRows,

    showForm,
    form,
    formActivities,
    formActivityInfo,
    chooseActivity,
    editingId,
    saving,
    canSave,
    formProblem,
    formUnliquidated,
    budgetWarning,
    deleteConfirmId,
    setDeleteConfirmId,

    openAddForm,
    openAddForActivity,
    openEditForm,
    closeForm,
    updateForm,
    saveEntry,
    removeEntry,

    ...totals,
  };
}
