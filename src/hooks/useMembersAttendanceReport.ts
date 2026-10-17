import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { Member } from "../types/member";

const MEMBERS_COLLECTION = "members";
const ATTENDANCE_COLLECTION = "membersAttendance";
const PAGE_SIZE = 10;

/** Missing this many of the most recent Sundays in a row flags a member for follow-up. */
export const FOLLOW_UP_MISSED_SUNDAYS = 3;

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** KPI cards that act on the table when clicked. All of them filter, except
 *  "rate", which keeps everyone but sorts by lowest attendance % first. */
export type KpiFilter = "rate" | "active" | "inactive" | "today" | "perfect" | "followup";

/** Label for a KPI filter. `focusLabel` ("Oct 2026") is set while a month is
 *  selected on the trend chart — the cards then describe that month. */
export function kpiLabel(filter: KpiFilter, focusLabel: string | null): string {
  switch (filter) {
    case "rate":
      return focusLabel ? `Lowest Attendance First (${focusLabel})` : "Lowest Attendance Rate First";
    case "active":
      return focusLabel ? `Attended in ${focusLabel}` : "Active This Month";
    case "inactive":
      return focusLabel ? `Absent all of ${focusLabel}` : "Inactive This Month";
    case "today":
      return "Present Today";
    case "perfect":
      return focusLabel ? `Perfect Attendance (${focusLabel})` : "Perfect Attendance";
    case "followup":
      return focusLabel
        ? `Needs Follow-up (missed last ${FOLLOW_UP_MISSED_SUNDAYS} Sundays up to ${focusLabel})`
        : `Needs Follow-up (missed last ${FOLLOW_UP_MISSED_SUNDAYS} Sundays)`;
  }
}

export type ReportPreset ="thisMonth" | "last3Months" | "thisQuarter" | "thisYear" | "custom";

export interface MonthPoint {
  year: number;
  month: number; // 0-indexed, matching JS Date
}

/** Category filter value for members with no category set. */
export const UNCATEGORIZED = "__uncategorized__";

interface ReportMember {
  id: string;
  name: string;
  category: string; // "" when not set
}

export interface MemberRangeRow {
  id: string;
  name: string;
  /** Attended count per month, aligned to the resolved month list for the selected range. */
  perMonth: number[];
  totalAttended: number;
  totalPossible: number;
  percent: number;
  needsFollowUp: boolean;
}

export interface MonthlyTrendPoint {
  key: string;
  label: string;
  /** false for months with no Sundays yet (still in the future) — nothing to click. */
  hasData: boolean;
  attended: number;
  possible: number;
  percent: number;
}

/** Sundays in the month that have already arrived (today included), so
 *  future Sundays don't count as absences. */
function getSundays(year: number, month: number, today: Date): number[] {
  const sundays: number[] = [];
  const date = new Date(year, month, 1);
  const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (date.getMonth() === month && date <= cutoff) {
    if (date.getDay() === 0) sundays.push(date.getDate());
    date.setDate(date.getDate() + 1);
  }
  return sundays;
}

function monthKey(p: MonthPoint): string {
  return `${p.year}-${p.month}`;
}

function enumerateMonths(from: MonthPoint, to: MonthPoint): MonthPoint[] {
  // Normalize in case the "from" point ends up after the "to" point.
  let a = from;
  let b = to;
  if (a.year > b.year || (a.year === b.year && a.month > b.month)) {
    [a, b] = [b, a];
  }

  const out: MonthPoint[] = [];
  let y = a.year;
  let m = a.month;
  while (y < b.year || (y === b.year && m <= b.month)) {
    out.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }
  return out;
}

function getPresetRange(
  preset: ReportPreset,
  custom: { from: MonthPoint; to: MonthPoint }
): { from: MonthPoint; to: MonthPoint } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (preset) {
    case "thisMonth":
      return { from: { year: y, month: m }, to: { year: y, month: m } };
    case "last3Months": {
      let fy = y;
      let fm = m - 2;
      while (fm < 0) {
        fm += 12;
        fy -= 1;
      }
      return { from: { year: fy, month: fm }, to: { year: y, month: m } };
    }
    case "thisQuarter": {
      const qStart = Math.floor(m / 3) * 3;
      return { from: { year: y, month: qStart }, to: { year: y, month: m } };
    }
    case "thisYear":
      return { from: { year: y, month: 0 }, to: { year: y, month: 11 } };
    case "custom":
    default:
      return custom;
  }
}

function formatMonthLabel(p: MonthPoint, spansMultipleYears: boolean): string {
  return spansMultipleYears ? `${MONTHS_SHORT[p.month]} '${String(p.year).slice(2)}` : MONTHS_SHORT[p.month];
}

/**
 * Yearly/range attendance report for Members.
 *
 * Reads the same `membersAttendance` collection written by useAttendanceTracker
 * (one doc per member per month, carrying `year`, `month` (0-indexed), and a
 * `days` map). The selected preset/custom range determines which months are
 * pulled in for the table, the trend chart, and the attendance-rate KPI.
 *
 * The "Active This Month" / "Inactive This Month" / "Present Today" KPI cards
 * are intentionally NOT tied to the selected range — they always reflect the
 * real current calendar month, via a small separate query, so they still make
 * sense no matter what period the report is showing.
 */
export default function useMembersAttendanceReport() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();
  const isTodaySunday = now.getDay() === 0;

  const [preset, setPreset] = useState<ReportPreset>("thisYear");
  const [customFrom, setCustomFrom] = useState<MonthPoint>({ year: currentYear, month: 0 });
  const [customTo, setCustomTo] = useState<MonthPoint>({ year: currentYear, month: currentMonth });

  const range = useMemo(
    () => getPresetRange(preset, { from: customFrom, to: customTo }),
    [preset, customFrom, customTo]
  );
  const months = useMemo(() => enumerateMonths(range.from, range.to), [range]);
  const spansMultipleYears = months.length > 0 && months[0].year !== months[months.length - 1].year;
  const monthsSignature = months.map(monthKey).join(",");

  const [allMembers, setAllMembers] = useState<ReportMember[]>([]);
  // Scopes the whole report (KPIs, chart, table) to one category, like Period
  // scopes it to a date range. "" = all categories.
  const [categoryFilter, setCategoryFilter] = useState("");

  /** Categories actually in use, alphabetical; plus whether anyone has none. */
  const categoryOptions = useMemo(() => {
    const set = new Set(allMembers.map((m) => m.category).filter(Boolean));
    return {
      categories: Array.from(set).sort((a, b) => a.localeCompare(b)),
      hasUncategorized: allMembers.some((m) => !m.category),
    };
  }, [allMembers]);

  const members = useMemo(() => {
    if (!categoryFilter) return allMembers;
    if (categoryFilter === UNCATEGORIZED) return allMembers.filter((m) => !m.category);
    return allMembers.filter((m) => m.category === categoryFilter);
  }, [allMembers, categoryFilter]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // { [memberId]: { ["year-month"]: { [day]: boolean } } }
  const [attendanceByMember, setAttendanceByMember] = useState<
    Record<string, Record<string, Record<number, boolean>>>
  >({});
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Always the real current month — independent of the selected range.
  const [currentMonthAttendance, setCurrentMonthAttendance] = useState<Record<string, Record<number, boolean>>>({});

  const [search, setSearch] = useState("");
  const [kpiFilter, setKpiFilter] = useState<KpiFilter | null>(null);
  // Month clicked on the trend chart ("year-month" key). Combines with
  // kpiFilter: e.g. "inactive" + Oct = members absent all of October.
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, kpiFilter, monthFilter, categoryFilter, preset, customFrom, customTo]);

  // A clicked month may fall outside a newly selected range.
  useEffect(() => {
    setMonthFilter(null);
  }, [monthsSignature]);

  // Active members only.
  useEffect(() => {
    let cancelled = false;
    setLoadingMembers(true);

    async function loadMembers() {
      try {
        const snapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
        const list: ReportMember[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<Member>;
          if (data.isArchived || data.isVisitor) return; // members only — visitors aren't counted in member KPIs
          const fullName = [data.firstName, data.lastName]
            .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
            .join(" ")
            .trim();
          if (fullName) list.push({ id: docSnap.id, name: fullName, category: (data.category ?? "").trim() });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setAllMembers(list);
      } catch (err) {
        console.error("Failed to load members for attendance report:", err);
      } finally {
        if (!cancelled) setLoadingMembers(false);
      }
    }

    loadMembers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Attendance for every year touched by the selected range.
  // Note: Firestore's "in" operator caps at 30 values — fine for any realistic
  // custom range, but keep that in mind if this is ever opened up further.
  useEffect(() => {
    let cancelled = false;
    setLoadingAttendance(true);

    async function loadRange() {
      try {
        if (months.length === 0) {
          if (!cancelled) setAttendanceByMember({});
          return;
        }
        const years = Array.from(new Set(months.map((p) => p.year)));
        const q = query(collection(db, ATTENDANCE_COLLECTION), where("year", "in", years));
        const snapshot = await getDocs(q);
        const wanted = new Set(months.map(monthKey));
        const byMember: Record<string, Record<string, Record<number, boolean>>> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as {
            trackeeId?: string;
            year?: number;
            month?: number;
            days?: Record<string, boolean>;
          };
          if (!data.trackeeId || data.year === undefined || data.month === undefined) return;
          const key = `${data.year}-${data.month}`;
          if (!wanted.has(key)) return;

          const days: Record<number, boolean> = {};
          if (data.days) {
            Object.entries(data.days).forEach(([d, v]) => {
              days[Number(d)] = !!v;
            });
          }
          if (!byMember[data.trackeeId]) byMember[data.trackeeId] = {};
          byMember[data.trackeeId][key] = days;
        });

        if (!cancelled) setAttendanceByMember(byMember);
      } catch (err) {
        console.error("Failed to load attendance for selected range:", err);
      } finally {
        if (!cancelled) setLoadingAttendance(false);
      }
    }

    loadRange();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthsSignature]);

  // Real current-month snapshot, for the "right now" KPI cards.
  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const q = query(collection(db, ATTENDANCE_COLLECTION), where("year", "==", currentYear));
        const snapshot = await getDocs(q);
        const data: Record<string, Record<number, boolean>> = {};

        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as { trackeeId?: string; month?: number; days?: Record<string, boolean> };
          if (!d.trackeeId || d.month !== currentMonth) return;
          const days: Record<number, boolean> = {};
          if (d.days) {
            Object.entries(d.days).forEach(([day, v]) => {
              days[Number(day)] = !!v;
            });
          }
          data[d.trackeeId] = days;
        });

        if (!cancelled) setCurrentMonthAttendance(data);
      } catch (err) {
        console.error("Failed to load current-month snapshot:", err);
      }
    }

    loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [currentYear, currentMonth]);

  const sundayCounts = useMemo(
    () => months.map((p) => getSundays(p.year, p.month, new Date()).length),
    [months]
  );
  const totalSundaysInRange = useMemo(() => sundayCounts.reduce((a, b) => a + b, 0), [sundayCounts]);
  const monthLabels = useMemo(
    () => months.map((p) => formatMonthLabel(p, spansMultipleYears)),
    [months, spansMultipleYears]
  );

  const rangeLabel = useMemo(() => {
    if (months.length === 0) return "";
    const first = months[0];
    const last = months[months.length - 1];
    const f = `${MONTHS_SHORT[first.month]} ${first.year}`;
    const l = `${MONTHS_SHORT[last.month]} ${last.year}`;
    return f === l ? f : `${f} – ${l}`;
  }, [months]);

  // Month clicked on the trend chart, as an index into `months` (-1 = none).
  // While set, the KPI cards and their table filters are about that month.
  const monthFilterIndex = monthFilter ? months.findIndex((p) => monthKey(p) === monthFilter) : -1;
  const focus = monthFilterIndex >= 0 ? months[monthFilterIndex] : null;
  const focusLabel = focus ? `${MONTHS_SHORT[focus.month]} ${focus.year}` : null;

  // The most recent Sundays that have already happened, newest first, ending at
  // the focused month (or the end of the range) — used to spot members who've
  // stopped coming.
  const recentSundays = useMemo(() => {
    const out: { key: string; day: number }[] = [];
    const endIndex = monthFilterIndex >= 0 ? monthFilterIndex : months.length - 1;
    for (let i = endIndex; i >= 0 && out.length < FOLLOW_UP_MISSED_SUNDAYS; i--) {
      const days = getSundays(months[i].year, months[i].month, new Date());
      for (let j = days.length - 1; j >= 0 && out.length < FOLLOW_UP_MISSED_SUNDAYS; j--) {
        out.push({ key: monthKey(months[i]), day: days[j] });
      }
    }
    return out;
  }, [months, monthFilterIndex]);

  const rows: MemberRangeRow[] = useMemo(() => {
    return members.map((m) => {
      const perMonth = months.map((p) => {
        const days = attendanceByMember[m.id]?.[monthKey(p)];
        return days ? Object.values(days).filter(Boolean).length : 0;
      });
      const totalAttended = perMonth.reduce((a, b) => a + b, 0);
      const totalPossible = totalSundaysInRange;
      const percent = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;
      // Absent on every one of the most recent Sundays — not total absences
      // across the range, which flagged even 85%-attendance members.
      const missedRecent =
        recentSundays.length > 0 &&
        recentSundays.every(({ key, day }) => !attendanceByMember[m.id]?.[key]?.[day]);

      return {
        id: m.id,
        name: m.name,
        perMonth,
        totalAttended,
        totalPossible,
        percent,
        needsFollowUp: missedRecent,
      };
    });
  }, [members, attendanceByMember, months, totalSundaysInRange, recentSundays]);

  // One predicate per clickable KPI card — used for both the card's count and
  // the table filter, so the number on the card always matches the rows shown.
  const kpiPredicates = useMemo<Record<KpiFilter, (r: MemberRangeRow) => boolean>>(() => {
    const i = monthFilterIndex;
    const isActive =
      i >= 0
        ? (r: MemberRangeRow) => r.perMonth[i] > 0
        : (r: MemberRangeRow) => {
            const days = currentMonthAttendance[r.id];
            return !!days && Object.values(days).some(Boolean);
          };
    return {
      rate: () => true,
      active: isActive,
      inactive: (r) => !isActive(r),
      today: (r) => isTodaySunday && !!currentMonthAttendance[r.id]?.[currentDay],
      perfect:
        i >= 0
          ? (r) => sundayCounts[i] > 0 && r.perMonth[i] === sundayCounts[i]
          : (r) => r.totalPossible > 0 && r.totalAttended === r.totalPossible,
      followup: (r) => r.needsFollowUp,
    };
  }, [currentMonthAttendance, isTodaySunday, currentDay, monthFilterIndex, sundayCounts]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const out = rows.filter(
      (r) => (!kpiFilter || kpiPredicates[kpiFilter](r)) && (!q || r.name.toLowerCase().includes(q))
    );
    if (kpiFilter === "rate") {
      const i = monthFilterIndex;
      const rate = (r: MemberRangeRow) => (i >= 0 ? r.perMonth[i] / (sundayCounts[i] || 1) : r.percent);
      out.sort((a, b) => rate(a) - rate(b) || a.name.localeCompare(b.name));
    }
    return out;
  }, [rows, search, kpiFilter, kpiPredicates, monthFilterIndex, sundayCounts]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const start = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(start, start + PAGE_SIZE);

  // ── KPIs ──
  const activeThisMonth = rows.filter(kpiPredicates.active).length;
  const inactiveThisMonth = rows.filter(kpiPredicates.inactive).length;
  const presentToday = rows.filter(kpiPredicates.today).length;
  const perfectAttendance = rows.filter(kpiPredicates.perfect).length;
  const needsFollowUpCount = rows.filter(kpiPredicates.followup).length;

  const monthlyTrend: MonthlyTrendPoint[] = useMemo(() => {
    return months.map((p, i) => {
      const attended = rows.reduce((sum, r) => sum + r.perMonth[i], 0);
      const possible = sundayCounts[i] * members.length;
      const percent = possible > 0 ? Math.round((attended / possible) * 100) : 0;
      return { key: monthKey(p), label: monthLabels[i], hasData: sundayCounts[i] > 0, attended, possible, percent };
    });
  }, [months, rows, sundayCounts, members.length, monthLabels]);

  const overallAttendanceRate =
    monthFilterIndex >= 0
      ? monthlyTrend[monthFilterIndex]?.percent ?? 0
      : totalSundaysInRange > 0 && members.length > 0
        ? Math.round(
            (rows.reduce((sum, r) => sum + r.totalAttended, 0) / (totalSundaysInRange * members.length)) * 100
          )
        : 0;

  /** e.g. "Absent all of Oct 2026", "All members · Oct 2026", "All members". */
  const filterSummary = kpiFilter
    ? kpiLabel(kpiFilter, focusLabel)
    : focusLabel
      ? `All members · ${focusLabel}`
      : "All members";

  return {
    loading: loadingMembers || loadingAttendance,

    preset,
    setPreset,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    rangeLabel,
    totalSundaysInRange,
    monthLabels,

    categoryFilter,
    setCategoryFilter,
    categoryOptions,
    sundayCounts,

    search,
    onSearchChange: setSearch,

    kpiFilter,
    // Clicking the selected card again (or "Total Members") clears the card
    // filter. The selected month, if any, stays.
    onKpiFilterChange: (next: KpiFilter | null) => setKpiFilter((cur) => (cur === next ? null : next)),

    monthFilter,
    monthFilterIndex,
    /** "Oct 2026" while a month is selected on the chart, otherwise null. */
    focusLabel,
    // Clicking the selected bar again clears it. Picking a month with no card
    // selected defaults to "who attended that month".
    onMonthFilterChange: (key: string) => {
      const selecting = key !== monthFilter;
      setMonthFilter(selecting ? key : null);
      if (selecting && !kpiFilter) setKpiFilter("active");
    },

    filterSummary,
    clearKpiFilter: () => setKpiFilter(null),
    clearMonthFilter: () => setMonthFilter(null),

    paginatedRows,
    filteredCount: filteredRows.length,
    currentPage: safeCurrentPage,
    totalPages,
    start,
    goFirst: () => setCurrentPage(1),
    goPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
    goNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    goLast: () => setCurrentPage(totalPages),

    kpis: {
      totalMembers: members.length,
      attendanceRate: overallAttendanceRate,
      activeThisMonth,
      inactiveThisMonth,
      presentToday,
      perfectAttendance,
      needsFollowUp: needsFollowUpCount,
    },

    monthlyTrend,
  };
}
