import { useEffect, useMemo, useState } from "react";
import { getAllMembers, unarchiveMember as unarchiveMemberDoc } from "../services/members/memberService/membersService";
import type { Member } from "../types/member";

export default function useArchivedMembers() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  async function refetch() {
    setLoading(true);
    try {
      const all = await getAllMembers();
      setMembers(all.filter((m) => m.isArchived));
    } catch (err) {
      console.error("Failed to load archived members:", err);
      setToast("Failed to load archived members.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      `${m.firstName} ${m.middleInitial} ${m.lastName}`.toLowerCase().includes(q)
    );
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedMembers = filteredMembers.slice(start, start + pageSize);

  function onSearchChange(value: string) {
    setSearch(value);
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

  async function unarchiveMember(id: string) {
    const prev = members;
    setMembers((cur) => cur.filter((m) => m.id !== id)); // optimistic — leaves the archived list
    try {
      await unarchiveMemberDoc(id);
      setToast("Member restored to Members list.");
    } catch (err) {
      console.error("Failed to unarchive member:", err);
      setMembers(prev); // rollback
      setToast("Failed to restore member.");
    }
  }

  return {
    loading,
    members: pagedMembers,
    archivedCount: members.length,
    filteredCount: filteredMembers.length,
    search,
    onSearchChange,
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
    unarchiveMember,
    refetch,
  };
}
