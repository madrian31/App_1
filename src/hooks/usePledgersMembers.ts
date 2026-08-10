import { useEffect, useMemo, useState } from "react";
import {
  getAllMembers,
  updateMember,
  archiveMember as archiveMemberDoc,
} from "../services/members/memberService/membersService";
import type { Member } from "../types/member";

export type PledgerFilter = "all" | "yes" | "no";

export default function usePledgersMembers() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PledgerFilter>("yes"); // this page defaults to pledgers only
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  async function refetch() {
    setLoading(true);
    try {
      const all = await getAllMembers();
      setMembers(all.filter((m) => !m.isArchived));
    } catch (err) {
      console.error("Failed to load members:", err);
      setToast("Failed to load members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !`${m.firstName} ${m.middleInitial} ${m.lastName}`.toLowerCase().includes(q)) return false;
      if (filter === "yes" && !m.isPledger) return false;
      if (filter === "no" && m.isPledger) return false;
      return true;
    });
  }, [members, search, filter]);

  const activeCount = useMemo(() => members.filter((m) => m.isPledger).length, [members]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedMembers = filteredMembers.slice(start, start + pageSize);

  function onSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }
  function onFilterChange(value: PledgerFilter) {
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

  async function togglePledger(id: string) {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const nextValue = !target.isPledger;
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, isPledger: nextValue } : m))); // optimistic
    try {
      await updateMember(id, { isPledger: nextValue });
      setToast(nextValue ? `${target.firstName} marked as pledger.` : `${target.firstName} removed as pledger.`);
    } catch (err) {
      console.error("Failed to update pledger status:", err);
      setMembers(prev); // rollback
      setToast("Failed to update pledger status.");
    }
  }

  async function archiveMember(id: string) {
    const prev = members;
    setMembers((cur) => cur.filter((m) => m.id !== id)); // optimistic — archived members leave this list
    try {
      await archiveMemberDoc(id);
      setToast("Member archived.");
    } catch (err) {
      console.error("Failed to archive member:", err);
      setMembers(prev); // rollback
      setToast("Failed to archive member.");
    }
  }

  return {
    loading,
    allMembers: members, // full list — used by the Add Members modal, independent of table pagination
    members: pagedMembers,
    activeCount,
    filteredCount: filteredMembers.length,
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
    togglePledger,
    archiveMember,
    refetch,
  };
}