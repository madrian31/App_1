import { useEffect, useMemo, useState } from "react";
import { getAllMembers } from "../services/members/memberService/membersService";
import {
  deleteVisitor,
  getVisitorAttendanceStats,
  makeVisitorMember,
  type VisitorAttendanceStats,
} from "../services/members/memberService/visitorsService";
import type { Member } from "../types/member";

export interface VisitorRow extends Member, VisitorAttendanceStats {}

/**
 * Drives Members → Visitors: people the attendance import added as visitors (not in the
 * directory yet), with how often they've attended, plus Make Member / Remove actions.
 * Most frequent attendees come first — they're the ones to follow up with.
 */
export default function useVisitors() {
  const [loading, setLoading] = useState(true);
  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = (await getAllMembers()).filter((m) => m.isVisitor && !m.isArchived);
        const stats = await getVisitorAttendanceStats(list.map((m) => m.id));
        if (cancelled) return;
        setVisitors(
          list
            .map((m) => ({ ...m, ...stats[m.id] }))
            .sort((a, b) => b.timesAttended - a.timesAttended || a.lastName.localeCompare(b.lastName))
        );
      } catch (err) {
        console.error("Failed to load visitors:", err);
        if (!cancelled) setToast("Failed to load visitors.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Toasts disappear on their own.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visitors;
    return visitors.filter((m) => `${m.firstName} ${m.middleInitial ?? ""} ${m.lastName}`.toLowerCase().includes(q));
  }, [visitors, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;

  function onSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }
  function onPageSizeChange(size: number) {
    setPageSize(size);
    setCurrentPage(1);
  }

  /** Returns true when done, so the page can open the new member's profile. */
  async function makeMember(id: string): Promise<boolean> {
    setBusyId(id);
    try {
      await makeVisitorMember(id);
      setVisitors((cur) => cur.filter((v) => v.id !== id));
      return true;
    } catch (err) {
      console.error("Failed to make visitor a member:", err);
      setToast("Failed to make this visitor a member.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function removeVisitor(id: string) {
    setBusyId(id);
    try {
      await deleteVisitor(id);
      setVisitors((cur) => cur.filter((v) => v.id !== id));
      setRemoveConfirmId(null);
      setToast("Visitor removed.");
    } catch (err) {
      console.error("Failed to remove visitor:", err);
      setToast("Failed to remove visitor.");
    } finally {
      setBusyId(null);
    }
  }

  return {
    loading,
    visitors: filtered.slice(start, start + pageSize),
    visitorCount: visitors.length,
    filteredCount: filtered.length,
    search,
    onSearchChange,
    pageSize,
    currentPage: safePage,
    totalPages,
    start,
    onPageSizeChange,
    goFirst: () => setCurrentPage(1),
    goPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
    goNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    goLast: () => setCurrentPage(totalPages),
    toast,
    busyId,
    removeConfirmId,
    setRemoveConfirmId,
    makeMember,
    removeVisitor,
  };
}
