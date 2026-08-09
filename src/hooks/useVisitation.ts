import { useEffect, useMemo, useState } from "react";
import { getAllVisits, deleteVisit as deleteVisitDoc } from "../services/visitation/visitationService";
import type { Visit } from "../types/visit";

export type QuickRange = "today" | "week" | "month" | "custom";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sunday
  copy.setDate(copy.getDate() - day);
  return copy;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Given a quick range option, returns the [from, to] ISO date pair. */
export function resolveQuickRange(range: QuickRange): { from: string; to: string } {
  const today = new Date();
  const todayISO = toISODate(today);

  switch (range) {
    case "today":
      return { from: todayISO, to: todayISO };
    case "week":
      return { from: toISODate(startOfWeek(today)), to: todayISO };
    case "month":
      return { from: toISODate(startOfMonth(today)), to: todayISO };
    case "custom":
    default:
      return { from: todayISO, to: todayISO };
  }
}

export default function useVisitation() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Search — applies live, like the Members page.
  const [search, setSearch] = useState("");

  // Department filter — staged, applied on "Filter" click.
  const [department, setDepartment] = useState("all");
  const [appliedDepartment, setAppliedDepartment] = useState("all");

  // Date range — staged, applied on "Filter" click.
  const [quickRange, setQuickRange] = useState<QuickRange>("month");
  const defaultRange = resolveQuickRange("month");
  const [dateFrom, setDateFrom] = useState(defaultRange.from);
  const [dateTo, setDateTo] = useState(defaultRange.to);
  const [appliedDateFrom, setAppliedDateFrom] = useState(defaultRange.from);
  const [appliedDateTo, setAppliedDateTo] = useState(defaultRange.to);

  // Pagination
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  async function refetch() {
    setLoading(true);
    try {
      const data = await getAllVisits();
      setVisits(data);
    } catch (err) {
      console.error("Failed to load visits:", err);
      setToast("Failed to load visits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  function onQuickRangeChange(range: QuickRange) {
    setQuickRange(range);
    if (range !== "custom") {
      const { from, to } = resolveQuickRange(range);
      setDateFrom(from);
      setDateTo(to);
    }
  }

  function onApplyFilter() {
    setAppliedDepartment(department);
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
    setCurrentPage(1);
  }

  function onResetFilter() {
    const { from, to } = resolveQuickRange("month");
    setDepartment("all");
    setQuickRange("month");
    setDateFrom(from);
    setDateTo(to);
    setAppliedDepartment("all");
    setAppliedDateFrom(from);
    setAppliedDateTo(to);
    setSearch("");
    setCurrentPage(1);
  }

  // Search applies live; department + date range apply only after "Filter" is clicked.
  const filteredVisits = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visits.filter((v) => {
      if (q && !v.memberName.toLowerCase().includes(q)) return false;
      if (appliedDepartment !== "all" && v.department !== appliedDepartment) return false;
      if (appliedDateFrom && v.date < appliedDateFrom) return false;
      if (appliedDateTo && v.date > appliedDateTo) return false;
      return true;
    });
  }, [visits, search, appliedDepartment, appliedDateFrom, appliedDateTo]);

  // Summary cards — computed from the same filtered set.
  const totalVisits = filteredVisits.length;
  const uniqueMembers = useMemo(
    () => new Set(filteredVisits.map((v) => v.memberId)).size,
    [filteredVisits]
  );

  // Pagination derived from filtered results.
  const totalPages = Math.max(1, Math.ceil(filteredVisits.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedVisits = filteredVisits.slice(start, start + pageSize);

  function goFirst() {
    setCurrentPage(1);
  }
  function goPrev() {
    setCurrentPage((p) => Math.max(1, p - 1));
  }
  function goNext() {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  }
  function goLast() {
    setCurrentPage(totalPages);
  }
  function onPageSizeChange(size: number) {
    setPageSize(size);
    setCurrentPage(1);
  }

  async function removeVisit(id: string) {
    const prev = visits;
    setVisits((cur) => cur.filter((v) => v.id !== id));
    try {
      await deleteVisitDoc(id);
      setToast("Visit deleted.");
    } catch (err) {
      console.error("Failed to delete visit:", err);
      setVisits(prev); // roll back on failure
      setToast("Failed to delete visit.");
    }
  }

  return {
    loading,
    visits: pagedVisits,
    filteredCount: filteredVisits.length,
    totalVisits,
    uniqueMembers,

    search,
    onSearchChange: setSearch,

    department,
    onDepartmentChange: setDepartment,

    quickRange,
    onQuickRangeChange,
    dateFrom,
    dateTo,
    onDateFromChange: setDateFrom,
    onDateToChange: setDateTo,

    onApplyFilter,
    onResetFilter,

    pageSize,
    currentPage: safePage,
    totalPages,
    start,
    onPageSizeChange,
    goFirst,
    goPrev,
    goNext,
    goLast,

    toast,
    deleteVisit: removeVisit,
    refetch,
  };
}
