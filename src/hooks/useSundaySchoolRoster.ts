import { useEffect, useMemo, useState } from "react";
import { getAllChildren, setChildActive } from "../services/sundaySchool/sundaySchoolChildrenService";
import { displayChildName } from "../types/sundaySchoolChild";
import type { SundaySchoolChild } from "../types/sundaySchoolChild";

export type RosterFilter = "active" | "dropped" | "all";

export default function useSundaySchoolRoster() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<SundaySchoolChild[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RosterFilter>("active");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  async function refetch() {
    setLoading(true);
    try {
      const all = await getAllChildren();
      setChildren(all);
    } catch (err) {
      console.error("Failed to load Sunday School roster:", err);
      setToast("Failed to load roster.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  const filteredChildren = useMemo(() => {
    const q = search.trim().toLowerCase();
    return children.filter((c) => {
      if (filter === "active" && !c.isActive) return false;
      if (filter === "dropped" && c.isActive) return false;
      if (q) {
        // Search matches first name, last name, AND nickname — a kid known only
        // by nickname should still be findable.
        const haystack = `${c.firstName || ""} ${c.lastName || ""} ${c.nickname || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [children, search, filter]);

  const activeCount = useMemo(() => children.filter((c) => c.isActive).length, [children]);

  const totalPages = Math.max(1, Math.ceil(filteredChildren.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedChildren = filteredChildren.slice(start, start + pageSize);

  function onSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }
  function onFilterChange(value: RosterFilter) {
    setFilter(value);
    setCurrentPage(1);
  }
  function onPageSizeChange(size: number) {
    setPageSize(size);
    setCurrentPage(1);
  }
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

  async function toggleActive(id: string) {
    const target = children.find((c) => c.id === id);
    if (!target) return;
    const nextValue = !target.isActive;
    const prev = children;
    setChildren((cur) => cur.map((c) => (c.id === id ? { ...c, isActive: nextValue } : c))); // optimistic
    try {
      await setChildActive(id, nextValue);
      setToast(nextValue ? `${displayChildName(target)} marked active.` : `${displayChildName(target)} marked as dropped.`);
    } catch (err) {
      console.error("Failed to update status:", err);
      setChildren(prev); // rollback
      setToast("Failed to update status.");
    }
  }

  return {
    loading,
    children: pagedChildren,
    activeCount,
    filteredCount: filteredChildren.length,
    search,
    onSearchChange,
    filter,
    onFilterChange,
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
    toggleActive,
    refetch,
  };
}
