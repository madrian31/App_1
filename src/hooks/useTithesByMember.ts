import { useEffect, useMemo, useRef, useState } from "react";
import { getAllMembers } from "../services/members/memberService/membersService";
import { buildMemberTitheId, deleteTithe, getTithes, setTithe } from "../services/tithes/tithesService";
import type { Member } from "../types/member";
import { lastSundayISO } from "./useTithes";

export type RowSaveStatus = "saving" | "saved" | "error";
export type MemberTitheFilter = "all" | "given" | "notGiven";

const SAVE_DEBOUNCE_MS = 800;
const SAVED_BADGE_MS = 1500;

interface EntryState {
  amount: string;
  notes: string; // not editable in the grid — kept so a save doesn't wipe notes set from the Entries tab
  exists: boolean; // a doc is stored for this member+date (so clearing the amount deletes it)
}

function memberFullName(m: Member): string {
  return `${m.firstName} ${m.lastName}`;
}

/** Shifts an ISO date by whole weeks — used by the prev/next Sunday buttons. */
function addWeeks(iso: string, weeks: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Drives the Tithes "Members" view: one date, every active member listed with
 * an amount input that auto-saves (debounced, flushed on blur).
 * Clearing a member's amount removes their tithe for that date.
 */
export default function useTithesByMember(currentUser: string) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [date, setDate] = useState(lastSundayISO);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MemberTitheFilter>("all");

  const [entries, setEntries] = useState<Record<string, EntryState>>({}); // keyed by memberId
  const [loadedDate, setLoadedDate] = useState("");
  const [rowStatus, setRowStatus] = useState<Record<string, RowSaveStatus | undefined>>({});

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savedClearTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Latest values per member, so a debounced save always writes what's on screen.
  const latest = useRef<Record<string, EntryState>>({});

  const loadingEntries = loadedDate !== date;

  useEffect(() => {
    getAllMembers()
      .then((all) =>
        setMembers(
          all
            .filter((m) => !m.isArchived && !m.isVisitor)
            .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
        )
      )
      .catch((err) => console.error("Failed to load members:", err))
      .finally(() => setLoadingMembers(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTithes(date, date)
      .then((list) => {
        if (cancelled) return;
        const map: Record<string, EntryState> = {};
        list.forEach((t) => {
          if (t.memberId) map[t.memberId] = { amount: String(t.amount ?? ""), notes: t.notes ?? "", exists: true };
        });
        latest.current = map;
        setEntries(map);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load tithes:", err);
      })
      .finally(() => {
        if (!cancelled) setLoadedDate(date);
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  // Cancel pending timers when switching dates, so a stale save doesn't land on the new date.
  useEffect(() => {
    const timers = saveTimers.current;
    const clearTimers = savedClearTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
      Object.values(clearTimers).forEach(clearTimeout);
      saveTimers.current = {};
      savedClearTimers.current = {};
      setRowStatus({});
    };
  }, [date]);

  function setStatus(memberId: string, status: RowSaveStatus | undefined) {
    setRowStatus((prev) => {
      const next = { ...prev };
      if (status) next[memberId] = status;
      else delete next[memberId];
      return next;
    });
  }

  function markSaving(memberId: string) {
    if (savedClearTimers.current[memberId]) {
      clearTimeout(savedClearTimers.current[memberId]);
      delete savedClearTimers.current[memberId];
    }
    setStatus(memberId, "saving");
  }

  function markSaved(memberId: string) {
    setStatus(memberId, "saved");
    savedClearTimers.current[memberId] = setTimeout(() => {
      setStatus(memberId, undefined);
      delete savedClearTimers.current[memberId];
    }, SAVED_BADGE_MS);
  }

  function updateEntry(memberId: string, patch: Partial<EntryState>) {
    const prev = latest.current[memberId] ?? { amount: "", notes: "", exists: false };
    const next = { ...prev, ...patch };
    latest.current = { ...latest.current, [memberId]: next };
    setEntries(latest.current);
  }

  async function writeEntry(member: Member) {
    const entry = latest.current[member.id];
    if (!entry) return;
    const amount = parseFloat(entry.amount) || 0;
    const id = buildMemberTitheId(member.id, date);

    // Nothing stored and nothing to store — e.g. typed then cleared before the save fired.
    if (amount <= 0 && !entry.exists) {
      setStatus(member.id, undefined);
      return;
    }

    markSaving(member.id);
    try {
      if (amount <= 0) {
        await deleteTithe(id);
        updateEntry(member.id, { exists: false });
      } else {
        await setTithe(id, {
          memberId: member.id,
          memberName: memberFullName(member),
          date,
          amount,
          notes: entry.notes.trim(),
          addedBy: currentUser,
        });
        updateEntry(member.id, { exists: true });
      }
      markSaved(member.id);
    } catch (err) {
      console.error("Failed to save tithe:", err);
      setStatus(member.id, "error");
    }
  }

  function scheduleSave(member: Member) {
    if (saveTimers.current[member.id]) clearTimeout(saveTimers.current[member.id]);
    markSaving(member.id);
    saveTimers.current[member.id] = setTimeout(() => {
      delete saveTimers.current[member.id];
      writeEntry(member);
    }, SAVE_DEBOUNCE_MS);
  }

  /** Saves right away on blur — but only if an edit is still pending. */
  function flushSave(member: Member) {
    if (!saveTimers.current[member.id]) return;
    clearTimeout(saveTimers.current[member.id]);
    delete saveTimers.current[member.id];
    writeEntry(member);
  }

  function handleAmountChange(member: Member, value: string) {
    updateEntry(member.id, { amount: value });
    scheduleSave(member);
  }


  const amountOf = (memberId: string) => parseFloat(entries[memberId]?.amount || "0") || 0;

  const visibleMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (q && !memberFullName(m).toLowerCase().includes(q)) return false;
      const given = (parseFloat(entries[m.id]?.amount || "0") || 0) > 0;
      if (filter === "given") return given;
      if (filter === "notGiven") return !given;
      return true;
    });
  }, [members, entries, search, filter]);

  const total = members.reduce((s, m) => s + amountOf(m.id), 0);
  const giverCount = members.filter((m) => amountOf(m.id) > 0).length;

  return {
    date,
    setDate,
    prevSunday: () => setDate((d) => addWeeks(d, -1)),
    nextSunday: () => setDate((d) => addWeeks(d, 1)),
    search,
    setSearch,
    filter,
    setFilter,

    members: visibleMembers,
    memberCount: members.length,
    loading: loadingMembers || loadingEntries,
    entries,
    rowStatus,

    handleAmountChange,
    flushSave,

    total,
    giverCount,
  };
}
