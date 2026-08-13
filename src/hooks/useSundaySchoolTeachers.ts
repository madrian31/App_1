import { useEffect, useMemo, useState } from "react";
import { getAllMembers, updateMember } from "../services/members/memberService/membersService";
import type { Member } from "../types/member";

export type TeacherFilter = "all" | "teachers" | "assistants";

export default function useSundaySchoolTeachers() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TeacherFilter>("all");
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

  // The table is a roster of people already assigned to a Sunday School role —
  // not a general member directory. Someone who isn't a Teacher or Assistant
  // Teacher never shows up here; they're only reachable through the Add
  // Teachers modal (which searches the full, unfiltered member list instead).
  const assignedMembers = useMemo(
    () => members.filter((m) => m.isSundaySchoolTeacher || m.isSundaySchoolAssistantTeacher),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignedMembers.filter((m) => {
      if (q && !`${m.firstName} ${m.middleInitial} ${m.lastName}`.toLowerCase().includes(q)) return false;
      if (filter === "teachers" && !m.isSundaySchoolTeacher) return false;
      if (filter === "assistants" && !m.isSundaySchoolAssistantTeacher) return false;
      return true;
    });
  }, [assignedMembers, search, filter]);

  const teacherCount = useMemo(() => members.filter((m) => m.isSundaySchoolTeacher).length, [members]);
  const assistantCount = useMemo(() => members.filter((m) => m.isSundaySchoolAssistantTeacher).length, [members]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedMembers = filteredMembers.slice(start, start + pageSize);

  function onSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }
  function onFilterChange(value: TeacherFilter) {
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

  async function toggleTeacher(id: string) {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const nextValue = !target.isSundaySchoolTeacher;
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, isSundaySchoolTeacher: nextValue } : m)));
    try {
      await updateMember(id, { isSundaySchoolTeacher: nextValue });
      setToast(nextValue ? `${target.firstName} marked as Teacher.` : `${target.firstName} removed as Teacher.`);
    } catch (err) {
      console.error("Failed to update teacher status:", err);
      setMembers(prev);
      setToast("Failed to update teacher status.");
    }
  }

  async function toggleAssistant(id: string) {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const nextValue = !target.isSundaySchoolAssistantTeacher;
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, isSundaySchoolAssistantTeacher: nextValue } : m)));
    try {
      await updateMember(id, { isSundaySchoolAssistantTeacher: nextValue });
      setToast(
        nextValue ? `${target.firstName} marked as Assistant Teacher.` : `${target.firstName} removed as Assistant Teacher.`
      );
    } catch (err) {
      console.error("Failed to update assistant teacher status:", err);
      setMembers(prev);
      setToast("Failed to update assistant teacher status.");
    }
  }

  return {
    loading,
    allMembers: members, // full, unfiltered list — used by the Add Teachers modal
    members: pagedMembers, // roster view — only currently-assigned Teachers/Assistants
    teacherCount,
    assistantCount,
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
    toggleTeacher,
    toggleAssistant,
    refetch,
  };
}