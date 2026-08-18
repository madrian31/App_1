import { useEffect, useMemo, useState } from "react";
import { getAllMembers, updateMember } from "../services/members/memberService/membersService";
import type { Member } from "../types/member";

export type PoolFilter = "all" | "council" | "worker";

/** Same shape as useSundaySchoolTeachers — a roster of Council Members /
 *  Workers, with toggles that write straight to the member doc. */
export default function useCouncilWorkerPool() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PoolFilter>("all");

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

  const assignedMembers = useMemo(
    () => members.filter((m) => m.isCouncilMember || m.isWorker),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assignedMembers.filter((m) => {
      if (q && !`${m.firstName} ${m.middleInitial} ${m.lastName}`.toLowerCase().includes(q)) return false;
      if (filter === "council" && !m.isCouncilMember) return false;
      if (filter === "worker" && !m.isWorker) return false;
      return true;
    });
  }, [assignedMembers, search, filter]);

  const councilCount = useMemo(() => members.filter((m) => m.isCouncilMember).length, [members]);
  const workerCount = useMemo(() => members.filter((m) => m.isWorker).length, [members]);

  async function toggleCouncil(id: string) {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const nextValue = !target.isCouncilMember;
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, isCouncilMember: nextValue } : m)));
    try {
      await updateMember(id, { isCouncilMember: nextValue });
      setToast(nextValue ? `${target.firstName} marked as Council Member.` : `${target.firstName} removed as Council Member.`);
    } catch (err) {
      console.error("Failed to update council status:", err);
      setMembers(prev);
      setToast("Failed to update council status.");
    }
  }

  async function toggleWorker(id: string) {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const nextValue = !target.isWorker;
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, isWorker: nextValue } : m)));
    try {
      await updateMember(id, { isWorker: nextValue });
      setToast(nextValue ? `${target.firstName} marked as Worker.` : `${target.firstName} removed as Worker.`);
    } catch (err) {
      console.error("Failed to update worker status:", err);
      setMembers(prev);
      setToast("Failed to update worker status.");
    }
  }

  return {
    loading,
    allMembers: members, // full list — for the "Add to pool" modal
    members: filteredMembers,
    councilCount,
    workerCount,
    search,
    onSearchChange: setSearch,
    filter,
    onFilterChange: setFilter,
    toast,
    toggleCouncil,
    toggleWorker,
    refetch,
  };
}
