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

interface ReportMember {
  id: string;
  name: string;
}

export interface MemberYearRow {
  id: string;
  name: string;
  /** Attended count per month, index 0 = Jan ... 11 = Dec. */
  perMonth: number[];
  totalAttended: number;
  totalPossible: number;
  percent: number;
  needsFollowUp: boolean;
}

export interface MonthlyTrendPoint {
  month: number;
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

function getSundayCountsForYear(year: number): number[] {
  return Array.from({ length: 12 }, (_, m) => getSundays(year, m).length);
}

/**
 * Yearly attendance report for Members.
 *
 * Reads the same `membersAttendance` collection written by useAttendanceTracker
 * (one doc per member per month, keyed by `${trackeeId}_${year}-${month}`,
 * carrying `year`, `month` (0-indexed), and a `days` map). This hook queries
 * every doc for the selected year in one go and aggregates it client-side.
 */
export default function useMembersAttendanceReport() {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const [members, setMembers] = useState<ReportMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // { [memberId]: { [month]: { [day]: boolean } } }
  const [attendanceByMember, setAttendanceByMember] = useState<
    Record<string, Record<number, Record<number, boolean>>>
  >({});
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, viewYear]);

  // Active members only (isArchived !== true), same shape used by the monthly tracker.
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

  // Every attendance doc for the selected year, across all months, in one query.
  useEffect(() => {
    let cancelled = false;
    setLoadingAttendance(true);

    async function loadYear() {
      try {
        const q = query(collection(db, ATTENDANCE_COLLECTION), where("year", "==", viewYear));
        const snapshot = await getDocs(q);
        const byMember: Record<string, Record<number, Record<number, boolean>>> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as {
            trackeeId?: string;
            month?: number;
            days?: Record<string, boolean>;
          };
          if (!data.trackeeId || data.month === undefined) return;

          const days: Record<number, boolean> = {};
          if (data.days) {
            Object.entries(data.days).forEach(([d, v]) => {
              days[Number(d)] = !!v;
            });
          }
          if (!byMember[data.trackeeId]) byMember[data.trackeeId] = {};
          byMember[data.trackeeId][data.month] = days;
        });

        if (!cancelled) setAttendanceByMember(byMember);
      } catch (err) {
        console.error("Failed to load yearly attendance:", err);
      } finally {
        if (!cancelled) setLoadingAttendance(false);
      }
    }

    loadYear();
    return () => {
      cancelled = true;
    };
  }, [viewYear]);

  const sundayCounts = useMemo(() => getSundayCountsForYear(viewYear), [viewYear]);
  const totalSundaysInYear = useMemo(
    () => sundayCounts.reduce((a, b) => a + b, 0),
    [sundayCounts]
  );

  const rows: MemberYearRow[] = useMemo(() => {
    return members.map((m) => {
      const perMonth = sundayCounts.map((_, month) => {
        const days = attendanceByMember[m.id]?.[month];
        return days ? Object.values(days).filter(Boolean).length : 0;
      });
      const totalAttended = perMonth.reduce((a, b) => a + b, 0);
      const totalPossible = totalSundaysInYear;
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
  }, [members, attendanceByMember, sundayCounts, totalSundaysInYear]);

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
  const today = new Date();
  const isCurrentYear = viewYear === today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  const isTodaySunday = today.getDay() === 0;

  const activeThisMonth = isCurrentYear
    ? rows.filter((r) => r.perMonth[currentMonth] > 0).length
    : 0;
  const inactiveThisMonth = isCurrentYear ? members.length - activeThisMonth : members.length;

  const presentToday =
    isCurrentYear && isTodaySunday
      ? rows.filter((r) => attendanceByMember[r.id]?.[currentMonth]?.[currentDay]).length
      : 0;

  const perfectAttendance = rows.filter(
    (r) => r.totalPossible > 0 && r.totalAttended === r.totalPossible
  ).length;
  const needsFollowUpCount = rows.filter((r) => r.needsFollowUp).length;

  const overallAttendanceRate =
    totalSundaysInYear > 0 && members.length > 0
      ? Math.round(
          (rows.reduce((sum, r) => sum + r.totalAttended, 0) /
            (totalSundaysInYear * members.length)) *
            100
        )
      : 0;

  const monthlyTrend: MonthlyTrendPoint[] = useMemo(() => {
    return sundayCounts.map((sundayCount, month) => {
      const attended = rows.reduce((sum, r) => sum + r.perMonth[month], 0);
      const possible = sundayCount * members.length;
      const percent = possible > 0 ? Math.round((attended / possible) * 100) : 0;
      return { month, label: MONTHS_SHORT[month], attended, possible, percent };
    });
  }, [rows, sundayCounts, members.length]);

  return {
    loading: loadingMembers || loadingAttendance,

    viewYear,
    goPrevYear: () => setViewYear((y) => y - 1),
    goNextYear: () => setViewYear((y) => y + 1),
    sundayCounts,
    totalSundaysInYear,
    monthsShort: MONTHS_SHORT,

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
