import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import type { Member } from "../types/member";

const MEMBERS_COLLECTION = "members";
const ATTENDANCE_COLLECTION = "membersAttendance";
const PAGE_SIZE = 10;

export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type ReportPreset = "thisMonth" | "last3Months" | "thisQuarter" | "thisYear" | "custom";

export interface MonthPoint {
  year: number;
  month: number; // 0-indexed, matching JS Date
}

interface ReportMember {
  id: string;
  name: string;
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
  attended: number;
  possible: number;
  percent: number;
}

function getSundays(year: number, month: number): number[] {
  const sundays: number[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
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

  const [members, setMembers] = useState<ReportMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // { [memberId]: { ["year-month"]: { [day]: boolean } } }
  const [attendanceByMember, setAttendanceByMember] = useState<
    Record<string, Record<string, Record<number, boolean>>>
  >({});
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // Always the real current month — independent of the selected range.
  const [currentMonthAttendance, setCurrentMonthAttendance] = useState<Record<string, Record<number, boolean>>>({});

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, preset, customFrom, customTo]);

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
          if (data.isArchived) return;
          const fullName = [data.firstName, data.lastName]
            .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
            .join(" ")
            .trim();
          if (fullName) list.push({ id: docSnap.id, name: fullName });
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) setMembers(list);
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

  const sundayCounts = useMemo(() => months.map((p) => getSundays(p.year, p.month).length), [months]);
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

  const rows: MemberRangeRow[] = useMemo(() => {
    return members.map((m) => {
      const perMonth = months.map((p) => {
        const days = attendanceByMember[m.id]?.[monthKey(p)];
        return days ? Object.values(days).filter(Boolean).length : 0;
      });
      const totalAttended = perMonth.reduce((a, b) => a + b, 0);
      const totalPossible = totalSundaysInRange;
      const percent = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;
      const absences = totalPossible - totalAttended;

      return {
        id: m.id,
        name: m.name,
        perMonth,
        totalAttended,
        totalPossible,
        percent,
        needsFollowUp: absences >= 3,
      };
    });
  }, [members, attendanceByMember, months, totalSundaysInRange]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q));
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const start = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedRows = filteredRows.slice(start, start + PAGE_SIZE);

  // ── KPIs ──
  const activeThisMonth = members.filter((m) => {
    const days = currentMonthAttendance[m.id];
    return days && Object.values(days).some(Boolean);
  }).length;
  const inactiveThisMonth = members.length - activeThisMonth;

  const presentToday = isTodaySunday
    ? members.filter((m) => currentMonthAttendance[m.id]?.[currentDay]).length
    : 0;

  const perfectAttendance = rows.filter((r) => r.totalPossible > 0 && r.totalAttended === r.totalPossible).length;
  const needsFollowUpCount = rows.filter((r) => r.needsFollowUp).length;

  const overallAttendanceRate =
    totalSundaysInRange > 0 && members.length > 0
      ? Math.round(
          (rows.reduce((sum, r) => sum + r.totalAttended, 0) / (totalSundaysInRange * members.length)) * 100
        )
      : 0;

  const monthlyTrend: MonthlyTrendPoint[] = useMemo(() => {
    return months.map((p, i) => {
      const attended = rows.reduce((sum, r) => sum + r.perMonth[i], 0);
      const possible = sundayCounts[i] * members.length;
      const percent = possible > 0 ? Math.round((attended / possible) * 100) : 0;
      return { key: monthKey(p), label: monthLabels[i], attended, possible, percent };
    });
  }, [months, rows, sundayCounts, members.length, monthLabels]);

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
    sundayCounts,

    search,
    onSearchChange: setSearch,

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