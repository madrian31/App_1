import { useEffect, useMemo, useState } from "react";
import { getAllVisits } from "../services/visitation/visitationService";
import { resolveQuickRange, type QuickRange } from "./useVisitation";
import type { Visit } from "../types/visit";

export interface DepartmentBreakdownRow {
  department: string;
  visits: number;
  membersVisited: number;
}

export interface PurposeBreakdownRow {
  purpose: string;
  visits: number;
}

export interface MemberHistoryRow {
  memberId: string;
  memberName: string;
  lastVisit: string; // ISO date
  totalVisits: number;
}

export default function useVisitationReports() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Date range — same quick-range pattern as the Visitation table, defaults to This Month.
  const [quickRange, setQuickRange] = useState<QuickRange>("month");
  const defaultRange = resolveQuickRange("month");
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);

  useEffect(() => {
    setLoading(true);
    getAllVisits()
      .then(setVisits)
      .catch((err) => {
        console.error("Failed to load visits for report:", err);
        setError("Failed to load visitation data.");
      })
      .finally(() => setLoading(false));
  }, []);

  function onQuickRangeChange(range: QuickRange) {
    setQuickRange(range);
    if (range !== "custom") {
      const { from, to } = resolveQuickRange(range);
      setDateFrom(from);
      setDateTo(to);
    }
  }

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      if (dateFrom && v.date < dateFrom) return false;
      if (dateTo && v.date > dateTo) return false;
      return true;
    });
  }, [visits, dateFrom, dateTo]);

  // ── Summary ──
  const totalVisits = filteredVisits.length;
  const membersVisited = useMemo(
    () => new Set(filteredVisits.map((v) => v.memberId)).size,
    [filteredVisits]
  );
  const departmentsCount = useMemo(
    () => new Set(filteredVisits.map((v) => v.department).filter(Boolean)).size,
    [filteredVisits]
  );

  // ── Visits by Department ──
  const byDepartment = useMemo<DepartmentBreakdownRow[]>(() => {
    const map = new Map<string, { visits: number; members: Set<string> }>();
    for (const v of filteredVisits) {
      const dept = v.department || "Unspecified";
      if (!map.has(dept)) map.set(dept, { visits: 0, members: new Set() });
      const entry = map.get(dept)!;
      entry.visits += 1;
      entry.members.add(v.memberId);
    }
    return Array.from(map.entries())
      .map(([department, { visits, members }]) => ({ department, visits, membersVisited: members.size }))
      .sort((a, b) => b.visits - a.visits);
  }, [filteredVisits]);

  // ── Visits by Purpose ──
  const byPurpose = useMemo<PurposeBreakdownRow[]>(() => {
    const map = new Map<string, number>();
    for (const v of filteredVisits) {
      const purpose = v.purpose || "Other";
      map.set(purpose, (map.get(purpose) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([purpose, visits]) => ({ purpose, visits }))
      .sort((a, b) => b.visits - a.visits);
  }, [filteredVisits]);

  // ── Member Visitation History ──
  const memberHistory = useMemo<MemberHistoryRow[]>(() => {
    const map = new Map<string, MemberHistoryRow>();
    for (const v of filteredVisits) {
      const existing = map.get(v.memberId);
      if (!existing) {
        map.set(v.memberId, {
          memberId: v.memberId,
          memberName: v.memberName,
          lastVisit: v.date,
          totalVisits: 1,
        });
      } else {
        existing.totalVisits += 1;
        if (v.date > existing.lastVisit) existing.lastVisit = v.date;
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1));
  }, [filteredVisits]);

  return {
    loading,
    error,
    quickRange,
    onQuickRangeChange,
    dateFrom,
    dateTo,
    onDateFromChange: setDateFrom,
    onDateToChange: setDateTo,

    totalVisits,
    membersVisited,
    departmentsCount,

    byDepartment,
    byPurpose,
    memberHistory,
  };
}
