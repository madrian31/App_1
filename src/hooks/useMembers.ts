import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { Member } from "../types/member";
import { getAllMembers, archiveMember as archiveMemberService } from "../services/members/memberService/membersService";

export function initials(m: Pick<Member, "firstName" | "lastName">): string {
  return `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase();
}

export interface UseMembersResult {
  loading: boolean;
  members: Member[];
  activeCount: number;
  filteredCount: number;
  search: string;
  pageSize: number;
  currentPage: number;
  totalPages: number;
  start: number;
  toast: string | null;
  onSearchChange: (value: string) => void;
  onPageSizeChange: (size: number) => void;
  goFirst: () => void;
  goPrev: () => void;
  goNext: () => void;
  goLast: () => void;
  archiveMember: (id: string) => void;
  refetch: () => void;
}

/**
 * useMembers
 * Kumukuha (Firestore), nagfi-filter, nagpapaginate, at nagha-handle ng
 * archive action para sa Members page.
 */
export default function useMembers(): UseMembersResult {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllMembers();
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      if (m.isArchived) return false;
      const fullName = `${m.firstName} ${m.middleName} ${m.lastName}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase())) return false;
      return true;
    });
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    if (currentPage < 1) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);
  const activeCount = members.filter((m) => !m.isArchived).length;

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const archiveMember = useCallback(
    async (id: string) => {
      const m = members.find((x) => x.id === id);
      if (!m) return;
      try {
        await archiveMemberService(id);
        setMembers((prev) => prev.map((x) => (x.id === id ? { ...x, isArchived: true } : x)));
        showToast(`${m.firstName} ${m.lastName} was archived.`);
      } catch (err) {
        console.error(err);
        showToast("Failed to archive member.");
      }
    },
    [members, showToast]
  );

  const onSearchChange = useCallback((value: string) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  const onPageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const goFirst = useCallback(() => setCurrentPage(1), []);
  const goPrev = useCallback(() => setCurrentPage((p) => Math.max(1, p - 1)), []);
  const goNext = useCallback(() => setCurrentPage((p) => Math.min(totalPages, p + 1)), [totalPages]);
  const goLast = useCallback(() => setCurrentPage(totalPages), [totalPages]);

  return {
    loading,
    members: paginated,
    activeCount,
    filteredCount: filtered.length,
    search,
    pageSize,
    currentPage,
    totalPages,
    start,
    toast,
    onSearchChange,
    onPageSizeChange,
    goFirst,
    goPrev,
    goNext,
    goLast,
    archiveMember,
    refetch: fetchMembers,
  };
}