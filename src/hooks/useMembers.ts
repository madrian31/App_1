import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import type { Member } from "../types/member";

// --- Mock data 
const MOCK_MEMBERS: Member[] = [
  { id: "1", firstName: "Maria", middleName: "", lastName: "Santos", userId: 101, isPledger: true, addedBy: "Admin", dateAdded: "2025-01-12", isArchived: false },
  { id: "2", firstName: "Jose", middleName: "M.", lastName: "Reyes", userId: 102, isPledger: false, addedBy: "Admin", dateAdded: "2025-02-03", isArchived: false },
  { id: "3", firstName: "Ana", middleName: "", lastName: "Cruz", userId: 103, isPledger: true, addedBy: "Pastor", dateAdded: "2025-02-20", isArchived: false },
  { id: "4", firstName: "Pedro", middleName: "", lastName: "Garcia", userId: 104, isPledger: false, addedBy: "Admin", dateAdded: "2025-03-05", isArchived: false },
  { id: "5", firstName: "Liza", middleName: "", lastName: "Torres", userId: 105, isPledger: true, addedBy: "Pastor", dateAdded: "2025-03-18", isArchived: false },
  { id: "6", firstName: "Mark", middleName: "", lastName: "Ramos", userId: 106, isPledger: false, addedBy: "Admin", dateAdded: "2025-04-01", isArchived: false },
  { id: "7", firstName: "Grace", middleName: "", lastName: "Lim", userId: 107, isPledger: true, addedBy: "Admin", dateAdded: "2025-04-14", isArchived: false },
  { id: "8", firstName: "Noel", middleName: "", lastName: "Bautista", userId: 108, isPledger: false, addedBy: "Pastor", dateAdded: "2025-05-02", isArchived: false },
  { id: "9", firstName: "Rosa", middleName: "", lastName: "Del Rosario", userId: 109, isPledger: true, addedBy: "Admin", dateAdded: "2025-05-19", isArchived: false },
  { id: "10", firstName: "Carlo", middleName: "", lastName: "Mendoza", userId: 110, isPledger: false, addedBy: "Admin", dateAdded: "2025-06-01", isArchived: false },
  { id: "11", firstName: "Elena", middleName: "", lastName: "Villanueva", userId: 111, isPledger: true, addedBy: "Pastor", dateAdded: "2025-06-15", isArchived: false },
];

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
}

/**
 * useMembers
 * Kumukuha, nagfi-filter, nagpapaginate, at nagha-handle ng archive action
 * para sa Members page. Palitan lang ang naka-comment na fetch simulation
 * ng tawag sa src/services (hal. membersService.getAll()) kapag may backend ka na.
 */
export default function useMembers(): UseMembersResult {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // simulate initial fetch — palitan ng: const data = await membersService.getAll();
  useEffect(() => {
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      if (!active) return;
      setMembers(MOCK_MEMBERS);
      setLoading(false);
    }, 300);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, []);

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
    (id: string) => {
      const m = members.find((x) => x.id === id);
      if (!m) return;
      setMembers((prev) => prev.map((x) => (x.id === id ? { ...x, isArchived: true } : x)));
      showToast(`${m.firstName} ${m.lastName} was archived.`);
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
  };
}
