import { useEffect, useMemo, useState } from "react";
import { getAllMembers } from "../services/members/memberService/membersService";
import {
  getPraiseWorshipLineUp,
  savePraiseWorshipLineUp,
} from "../services/praiseWorship/praiseWorshipLineUpService";
import { isPraiseWorshipTeamMember } from "../types/member";
import type { Member } from "../types/member";
import type { RoleAssignment } from "../types/programLineUp";
import { PW_SLOTS, formatLineUpMessage } from "../types/praiseWorship";
import type { PraiseWorshipSkill } from "../types/praiseWorship";
import { toLocalISODate } from "../utils/date";

// The team's usual practice: the Saturday before, 4 PM. Only a starting
// value for a new line-up — saved line-ups keep whatever was set.
const DEFAULT_PRACTICE_TIME = "16:00";

/** Today if it's Sunday, otherwise the coming Sunday. */
function nextSunday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return toLocalISODate(d);
}

function dayBefore(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return toLocalISODate(d);
}

function emptyAssignments(): Record<string, RoleAssignment[]> {
  return Object.fromEntries(PW_SLOTS.map((s) => [s.key, []]));
}

/** One song per line. Leading bullets ("* ", "- ", "• ") are dropped, so a
 *  list pasted from the group chat works as-is. */
function parseSongs(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim().replace(/^[*\-•]+\s*/, ""))
    .filter(Boolean);
}

export interface SongItem {
  key: string; // stable React key, so a row keeps focus while it's edited or moved
  title: string;
}

let nextSongKey = 0;
function newSong(title: string): SongItem {
  nextSongKey += 1;
  return { key: `song-${nextSongKey}`, title };
}

export interface SlotOptions {
  qualified: RoleAssignment[]; // team members marked for this position
  others: RoleAssignment[]; // the rest of the team, as a fallback
}

export default function usePraiseWorshipLineUp(currentUser: string, initialDate?: string) {
  const [date, setDate] = useState(initialDate || nextSunday());

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);

  // Which date's saved line-up is currently in the form. While it differs
  // from `date`, the form is still loading and can't be saved.
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Record<string, RoleAssignment[]>>(emptyAssignments);
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [practiceDate, setPracticeDate] = useState("");
  const [practiceTime, setPracticeTime] = useState(DEFAULT_PRACTICE_TIME);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getAllMembers()
      .then((all) => setMembers(all.filter((m) => !m.isArchived && !m.isVisitor)))
      .catch((err) => {
        console.error("Failed to load members:", err);
        setMembersError("Failed to load members. Please refresh the page.");
      })
      .finally(() => setLoadingMembers(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPraiseWorshipLineUp(date)
      .then((entry) => {
        if (cancelled) return;
        setAssignments({ ...emptyAssignments(), ...entry?.assignments });
        setSongs((entry?.songs ?? []).map((title) => newSong(title)));
        setPracticeDate(entry ? entry.practiceDate ?? "" : dayBefore(date));
        setPracticeTime(entry ? entry.practiceTime ?? "" : DEFAULT_PRACTICE_TIME);
        setEntryError(null);
        setLoadedDate(date);
      })
      .catch((err) => {
        console.error("Failed to load line-up:", err);
        // loadedDate is left as-is, so Save stays disabled and a failed
        // load can never overwrite the saved line-up with an empty one.
        if (!cancelled) setEntryError("Failed to load the line-up for this date. Please refresh the page.");
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const team = useMemo(
    () =>
      members
        .filter(isPraiseWorshipTeamMember)
        .map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}`, skills: m.praiseWorshipSkills ?? [] }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members]
  );

  /** Everyone on the team, with those marked for `skill` listed first. */
  function optionsFor(skill: PraiseWorshipSkill): SlotOptions {
    const qualified: RoleAssignment[] = [];
    const others: RoleAssignment[] = [];
    for (const t of team) {
      (t.skills.includes(skill) ? qualified : others).push({ id: t.id, name: t.name });
    }
    return { qualified, others };
  }

  function setSlot(slotKey: string, people: RoleAssignment[]) {
    setAssignments((cur) => ({ ...cur, [slotKey]: people }));
  }

  /** Adds one title, or several at once when a list is pasted (one per line). */
  function addSongs(text: string) {
    const titles = parseSongs(text);
    if (titles.length > 0) setSongs((cur) => [...cur, ...titles.map((title) => newSong(title))]);
  }

  function renameSong(key: string, title: string) {
    setSongs((cur) => cur.map((s) => (s.key === key ? { ...s, title } : s)));
  }

  function removeSong(key: string) {
    setSongs((cur) => cur.filter((s) => s.key !== key));
  }

  function moveSong(key: string, direction: -1 | 1) {
    setSongs((cur) => {
      const from = cur.findIndex((s) => s.key === key);
      const to = from + direction;
      if (from === -1 || to < 0 || to >= cur.length) return cur;
      const next = [...cur];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  // A row emptied while editing is simply left out of the message and the save.
  const songTitles = useMemo(() => songs.map((s) => s.title.trim()).filter(Boolean), [songs]);

  const message = useMemo(
    () => formatLineUpMessage({ date, assignments, songs: songTitles, practiceDate, practiceTime }),
    [date, assignments, songTitles, practiceDate, practiceTime]
  );

  async function submit(): Promise<boolean> {
    if (loadedDate !== date) return false;
    setSaving(true);
    try {
      await savePraiseWorshipLineUp({
        id: date,
        date,
        assignments,
        songs: songTitles,
        practiceDate: practiceDate || undefined,
        practiceTime: practiceTime || undefined,
        addedBy: currentUser,
      });
      setToast("Line-up saved.");
      return true;
    } catch (err) {
      console.error("Failed to save line-up:", err);
      setToast("Failed to save line-up.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setToast("Line-up copied. You can now paste it in the group chat.");
    } catch {
      setToast("Could not copy. Please select the message and copy it by hand.");
    }
  }

  return {
    date,
    setDate,
    loading: loadingMembers || loadedDate !== date,
    loadError: membersError ?? entryError,
    saving,
    toast,

    teamCount: team.length,
    optionsFor,
    assignments,
    setSlot,

    songs,
    addSongs,
    renameSong,
    removeSong,
    moveSong,
    practiceDate,
    setPracticeDate,
    practiceTime,
    setPracticeTime,

    message,
    submit,
    copyMessage,
  };
}
