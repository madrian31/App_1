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
import type { PraiseWorshipSkill, PraiseWorshipSong } from "../types/praiseWorship";
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
 *  list pasted from the group chat works as-is, and "Title - Artist" (a
 *  dash with spaces around it) fills in both. */
function parseSongs(text: string): PraiseWorshipSong[] {
  return text
    .split("\n")
    .map((line) => line.trim().replace(/^[*\-•]+\s*/, ""))
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split(/\s+[-–—]\s+/);
      const artist = rest.join(" - ").trim();
      return { title: title.trim(), artist };
    });
}

export interface SongItem {
  key: string; // stable React key, so a row keeps focus while it's edited or moved
  title: string;
  artist: string; // "" when not known
}

let nextSongKey = 0;
function newSong(song: PraiseWorshipSong): SongItem {
  nextSongKey += 1;
  return { key: `song-${nextSongKey}`, title: song.title, artist: song.artist ?? "" };
}

/** Comparable fingerprint of what Save would write — used to tell whether
 *  the form has changes that aren't saved yet. */
function snapshotOf(
  assignments: Record<string, RoleAssignment[]>,
  songs: PraiseWorshipSong[],
  practiceDate: string,
  practiceTime: string
): string {
  return JSON.stringify({
    assignments: PW_SLOTS.map((s) => (assignments[s.key] ?? []).map((p) => p.id)),
    songs: songs.map((s) => [s.title.trim(), (s.artist ?? "").trim()]),
    practiceDate,
    practiceTime,
  });
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

  // What's saved in Firestore for this date, as a snapshot, so unsaved
  // changes can be flagged before they're lost to a refresh.
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);
  const [hasSavedEntry, setHasSavedEntry] = useState(false);

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
        const loadedAssignments = { ...emptyAssignments(), ...entry?.assignments };
        const loadedSongs = entry?.songs ?? [];
        const loadedPracticeDate = entry ? entry.practiceDate ?? "" : dayBefore(date);
        const loadedPracticeTime = entry ? entry.practiceTime ?? "" : DEFAULT_PRACTICE_TIME;
        setAssignments(loadedAssignments);
        setSongs(loadedSongs.map((song) => newSong(song)));
        setPracticeDate(loadedPracticeDate);
        setPracticeTime(loadedPracticeTime);
        setSavedSnapshot(snapshotOf(loadedAssignments, loadedSongs, loadedPracticeDate, loadedPracticeTime));
        setHasSavedEntry(Boolean(entry));
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

  /** Adds what was typed in the Title/Artist boxes. With no artist typed,
   *  the title goes through parseSongs, so a pasted list (one per line) or
   *  "Title - Artist" still splits correctly. */
  function addSongs(title: string, artist = "") {
    const added = (artist.trim() ? [{ title: title.trim(), artist: artist.trim() }] : parseSongs(title)).filter(
      (s) => s.title
    );
    if (added.length > 0) setSongs((cur) => [...cur, ...added.map((song) => newSong(song))]);
  }

  function updateSong(key: string, patch: Partial<Pick<SongItem, "title" | "artist">>) {
    setSongs((cur) => cur.map((s) => (s.key === key ? { ...s, ...patch } : s)));
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

  // A row whose title was emptied is left out of the message and the save.
  // Artist is only included when filled in — Firestore rejects `undefined`
  // inside array items, so the key is left off instead.
  const songList = useMemo<PraiseWorshipSong[]>(
    () =>
      songs
        .map((s) => ({ title: s.title.trim(), artist: s.artist.trim() }))
        .filter((s) => s.title)
        .map((s) => (s.artist ? s : { title: s.title })),
    [songs]
  );

  const message = useMemo(
    () => formatLineUpMessage({ date, assignments, songs: songList, practiceDate, practiceTime }),
    [date, assignments, songList, practiceDate, practiceTime]
  );

  const currentSnapshot = useMemo(
    () => snapshotOf(assignments, songList, practiceDate, practiceTime),
    [assignments, songList, practiceDate, practiceTime]
  );
  const isDirty = loadedDate === date && savedSnapshot !== null && currentSnapshot !== savedSnapshot;

  // The browser's own "Leave site? Changes you made may not be saved."
  // prompt on refresh / closing the tab while there are unsaved changes.
  useEffect(() => {
    if (!isDirty) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  async function submit(): Promise<boolean> {
    if (loadedDate !== date) return false;
    setSaving(true);
    try {
      await savePraiseWorshipLineUp({
        id: date,
        date,
        assignments,
        songs: songList,
        practiceDate: practiceDate || undefined,
        practiceTime: practiceTime || undefined,
        addedBy: currentUser,
      });
      setSavedSnapshot(currentSnapshot);
      setHasSavedEntry(true);
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
    isDirty,
    hasSavedEntry,
    toast,

    teamCount: team.length,
    optionsFor,
    assignments,
    setSlot,

    songs,
    addSongs,
    updateSong,
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
