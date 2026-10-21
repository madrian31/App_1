import { useEffect, useMemo, useState } from "react";
import { getAllMembers, updateMember } from "../services/members/memberService/membersService";
import { isPraiseWorshipTeamMember } from "../types/member";
import type { Member } from "../types/member";
import type { PraiseWorshipSkill } from "../types/praiseWorship";

/** "none" = team members with no positions set yet. */
export type SkillFilter = PraiseWorshipSkill | "all" | "none";

function fullName(m: Member): string {
  return `${m.firstName}${m.middleInitial ? ` ${m.middleInitial}` : ""} ${m.lastName}`;
}

export default function usePraiseWorshipMembers() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<SkillFilter>("all");

  useEffect(() => {
    getAllMembers()
      .then((all) => setMembers(all.filter((m) => !m.isArchived && !m.isVisitor)))
      .catch((err) => {
        console.error("Failed to load members:", err);
        setToast("Failed to load members.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const team = useMemo(() => members.filter(isPraiseWorshipTeamMember), [members]);

  const filteredTeam = useMemo(() => {
    const q = search.trim().toLowerCase();
    return team
      .filter((m) => {
        if (q && !fullName(m).toLowerCase().includes(q)) return false;
        const skills = m.praiseWorshipSkills ?? [];
        if (skillFilter === "none") return skills.length === 0;
        if (skillFilter !== "all") return skills.includes(skillFilter);
        return true;
      })
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [team, search, skillFilter]);

  async function setOnTeam(id: string, onTeam: boolean) {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const prev = members;
    setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, isPraiseWorshipMember: onTeam } : m)));
    try {
      await updateMember(id, { isPraiseWorshipMember: onTeam });
      setToast(onTeam ? `${target.firstName} added to the team.` : `${target.firstName} removed from the team.`);
    } catch (err) {
      console.error("Failed to update Praise & Worship team:", err);
      setMembers(prev);
      setToast("Failed to update the team.");
    }
  }

  async function saveSkills(id: string, skills: PraiseWorshipSkill[]): Promise<boolean> {
    const target = members.find((m) => m.id === id);
    if (!target) return false;
    try {
      await updateMember(id, { praiseWorshipSkills: skills });
      setMembers((cur) => cur.map((m) => (m.id === id ? { ...m, praiseWorshipSkills: skills } : m)));
      setToast(`Positions saved for ${target.firstName}.`);
      return true;
    } catch (err) {
      console.error("Failed to save positions:", err);
      setToast("Failed to save positions.");
      return false;
    }
  }

  return {
    loading,
    allMembers: members, // every active member — used by the Add Members modal
    team: filteredTeam, // roster view, after search + position filter
    teamCount: team.length,
    filteredCount: filteredTeam.length,
    search,
    setSearch,
    skillFilter,
    setSkillFilter,
    toast,
    setOnTeam,
    saveSkills,
  };
}
