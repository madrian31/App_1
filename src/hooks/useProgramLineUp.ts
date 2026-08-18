import { useEffect, useMemo, useState } from "react";
import { getAllMembers } from "../services/members/memberService/membersService";
import {
  getRotationQueue,
  seedRotationQueueIfEmpty,
  advanceRotationQueue,
} from "../services/rotationQueue/rotationQueueService";
import { getLineUpForDate, saveLineUp } from "../services/programLineUp/programLineUpService";
import { resolveProgramType } from "../types/programLineUp";
import type { ProgramType, RoleAssignment } from "../types/programLineUp";
import type { RotationRole } from "../types/rotationQueue";
import { getMonthlyCelebrants } from "../types/member";
import type { Member, MonthlyCelebrant } from "../types/member";

const USHER_CATEGORIES = ["Men", "Women", "Youth Boys", "Youth Girls", "Young Adult/Young Professional"];
const SPECIAL_NUMBER_CATEGORIES = ["Student", "Men", "Women", "Youth Boys", "Youth Girls"];

interface RoleState {
  current: RoleAssignment | null;
  upNext: RoleAssignment[]; // excludes current — for the popover
}

const EMPTY_ROLE: RoleState = { current: null, upNext: [] };

/** Nearest upcoming Sunday or Wednesday depending on what's next. */
function nextServiceDate(): string {
  const d = new Date();
  const day = d.getDay();
  const daysToSunday = (7 - day) % 7;
  d.setDate(d.getDate() + daysToSunday);
  return d.toISOString().slice(0, 10);
}

export default function useProgramLineUp(currentUser: string) {
  const [date, setDate] = useState(nextServiceDate());
  const programType: ProgramType = resolveProgramType(date);

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [presider, setPresider] = useState<RoleState>(EMPTY_ROLE);
  const [speaker, setSpeaker] = useState<RoleState>(EMPTY_ROLE);
  const [specialNumber, setSpecialNumber] = useState<RoleState>(EMPTY_ROLE);
  const [usher, setUsher] = useState<RoleState>(EMPTY_ROLE);
  const [flowerFamily, setFlowerFamily] = useState<RoleState>(EMPTY_ROLE);

  const [themeTitle, setThemeTitle] = useState("");
  const [themeVerse, setThemeVerse] = useState("");
  const [announcements, setAnnouncements] = useState("");

  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoadingMembers(true);
    getAllMembers()
      .then((all) => setMembers(all.filter((m) => !m.isArchived)))
      .catch((err) => console.error("Failed to load members:", err))
      .finally(() => setLoadingMembers(false));
  }, []);

  function nameOf(id: string): string {
    const m = members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : id;
  }

  /** Builds a RoleState from a queue's ordered items, resolving display names
   *  via `resolveName` (member lookup for people, identity for categories). */
  function buildRoleState(items: string[], resolveName: (id: string) => string): RoleState {
    if (items.length === 0) return EMPTY_ROLE;
    const [currentId, ...rest] = items;
    return {
      current: { id: currentId, name: resolveName(currentId) },
      upNext: rest.map((id) => ({ id, name: resolveName(id) })),
    };
  }

  async function loadRole(
    role: RotationRole,
    seedItems: string[],
    resolveName: (id: string) => string
  ): Promise<RoleState> {
    await seedRotationQueueIfEmpty(role, seedItems);
    const q = await getRotationQueue(role);
    return buildRoleState(q?.items ?? [], resolveName);
  }

  // Reload everything whenever the date (and therefore programType) or the
  // member list changes. If a lineup already exists for this date, its saved
  // assignments override the "front of queue" default (so re-opening an
  // already-scheduled date shows what was actually saved, not a fresh pick).
  useEffect(() => {
    if (loadingMembers) return;
    let cancelled = false;
    setLoadingEntry(true);

    async function run() {
      const councilIds = members.filter((m) => m.isCouncilMember).map((m) => m.id);
      const workerIds = members.filter((m) => m.isWorker).map((m) => m.id);
      // Wednesday Presider pool: Youth OR Council Member, but NEVER a Worker
      // — even if that person is also Youth and/or Council.
      const wedPresiderPoolIds = members
        .filter((m) => (m.isCouncilMember || m.category?.startsWith("Youth")) && !m.isWorker)
        .map((m) => m.id);

      const [presiderQ, speakerQ, specialNumberQ, usherQ, flowerQ, existing] = await Promise.all([
        loadRole("presiderCouncil", councilIds, nameOf),
        loadRole("speakerWorker", workerIds, nameOf),
        loadRole("specialNumberCategory", SPECIAL_NUMBER_CATEGORIES, (id) => id),
        loadRole("usherCategory", USHER_CATEGORIES, (id) => id),
        loadRole("flowerFamily", [], (id) => id), // family list has no auto-seed yet — added manually for now
        getLineUpForDate(date),
      ]);

      if (cancelled) return;

      if (programType === "prayerMeeting") {
        // Wednesday: Presider <- wedPresiderPool (Youth/Council, not Worker).
        // Speaker <- Council pool (church rule: Wed speaker is a Council Member).
        const [wedPresiderQ, wedSpeakerQ] = await Promise.all([
          loadRole("wedPresiderPool", wedPresiderPoolIds, nameOf),
          loadRole("presiderCouncil", councilIds, nameOf),
        ]);
        setPresider(existing ? { current: existing.presider, upNext: wedPresiderQ.upNext } : wedPresiderQ);
        setSpeaker(existing ? { current: existing.speaker, upNext: wedSpeakerQ.upNext } : wedSpeakerQ);
        setSpecialNumber(EMPTY_ROLE);
        setUsher(EMPTY_ROLE);
        setFlowerFamily(EMPTY_ROLE);
      } else {
        setPresider(existing ? { current: existing.presider, upNext: presiderQ.upNext } : presiderQ);
        setSpeaker(existing ? { current: existing.speaker, upNext: speakerQ.upNext } : speakerQ);
        setSpecialNumber(
          existing?.specialNumber ? { current: existing.specialNumber, upNext: specialNumberQ.upNext } : specialNumberQ
        );
        setUsher(existing?.usher ? { current: existing.usher, upNext: usherQ.upNext } : usherQ);
        setFlowerFamily(
          existing?.flowerFamily ? { current: existing.flowerFamily, upNext: flowerQ.upNext } : flowerQ
        );
      }

      setThemeTitle(existing?.themeTitle ?? "");
      setThemeVerse(existing?.themeVerse ?? "");
      setAnnouncements(existing?.announcements ?? "");

      setLoadingEntry(false);
    }

    run().catch((err) => {
      console.error("Failed to load line-up:", err);
      if (!cancelled) {
        setToast("Failed to load line-up.");
        setLoadingEntry(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [date, programType, loadingMembers, members]);

  // Auto-computed, not stored per lineup — re-runs whenever the viewed
  // date's month changes, so it's always "whoever has a birthday/anniversary
  // in the current month," matching how the church announces it.
  const monthlyCelebrants: MonthlyCelebrant[] = useMemo(() => {
    const month = new Date(`${date}T00:00:00`).getMonth();
    return getMonthlyCelebrants(members, month);
  }, [members, date]);

  // Full pools (not just queue order) — used by the Reassign modal so any
  // eligible person/category can be picked, not only whoever's next in line.
  const councilPool: RoleAssignment[] = useMemo(
    () => members.filter((m) => m.isCouncilMember).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
    [members]
  );
  const workerPool: RoleAssignment[] = useMemo(
    () => members.filter((m) => m.isWorker).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
    [members]
  );
  const wedPresiderPool: RoleAssignment[] = useMemo(
    () =>
      members
        .filter((m) => (m.isCouncilMember || m.category?.startsWith("Youth")) && !m.isWorker)
        .map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
    [members]
  );
  const usherPool: RoleAssignment[] = USHER_CATEGORIES.map((c) => ({ id: c, name: c }));
  const specialNumberPool: RoleAssignment[] = SPECIAL_NUMBER_CATEGORIES.map((c) => ({ id: c, name: c }));

  /** Presider pool depends on the day: Wednesday uses the Youth/Council mix,
   *  Sunday uses plain Council. Speaker is the mirror — Council on
   *  Wednesday, Worker on Sunday. */
  const presiderPool = programType === "prayerMeeting" ? wedPresiderPool : councilPool;
  const speakerPool = programType === "prayerMeeting" ? councilPool : workerPool;

  /** Manual override — pick anyone from the pool regardless of queue order. */
  function reassign(roleSetter: (s: RoleState) => void, current: RoleState, pick: RoleAssignment) {
    roleSetter({ current: pick, upNext: current.upNext });
  }

  async function submit(): Promise<boolean> {
    if (!presider.current || !speaker.current) {
      setToast("Presider and Speaker are required.");
      return false;
    }
    setSaving(true);
    try {
      await saveLineUp({
        id: date,
        date,
        programType,
        presider: presider.current,
        speaker: speaker.current,
        specialNumber: specialNumber.current ?? undefined,
        usher: usher.current ?? undefined,
        flowerFamily: flowerFamily.current ?? undefined,
        themeTitle: themeTitle.trim() || undefined,
        themeVerse: themeVerse.trim() || undefined,
        announcements: announcements.trim() || undefined,
        addedBy: currentUser,
        dateAdded: new Date().toISOString(),
      });

      // Advance every role's queue with whoever ended up assigned — whether
      // picked automatically (front of queue) or manually (out of turn).
      const advances: [RotationRole, string][] = [
        [programType === "prayerMeeting" ? "wedPresiderPool" : "presiderCouncil", presider.current.id],
        [programType === "prayerMeeting" ? "presiderCouncil" : "speakerWorker", speaker.current.id],
      ];
      if (specialNumber.current) advances.push(["specialNumberCategory", specialNumber.current.id]);
      if (usher.current) advances.push(["usherCategory", usher.current.id]);
      if (flowerFamily.current) advances.push(["flowerFamily", flowerFamily.current.id]);

      await Promise.all(advances.map(([role, id]) => advanceRotationQueue(role, id)));

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

  return {
    date,
    setDate,
    programType,
    loading: loadingMembers || loadingEntry,
    saving,
    toast,

    presider,
    speaker,
    specialNumber,
    usher,
    flowerFamily,

    themeTitle,
    setThemeTitle,
    themeVerse,
    setThemeVerse,
    announcements,
    setAnnouncements,
    monthlyCelebrants,

    presiderPool,
    speakerPool,
    usherPool,
    specialNumberPool,
    // Flower Family has no member-based source list (no household grouping
    // exists yet) — the Reassign UI for it takes free-text input instead.

    reassignPresider: (pick: RoleAssignment) => reassign(setPresider, presider, pick),
    reassignSpeaker: (pick: RoleAssignment) => reassign(setSpeaker, speaker, pick),
    reassignSpecialNumber: (pick: RoleAssignment) => reassign(setSpecialNumber, specialNumber, pick),
    reassignUsher: (pick: RoleAssignment) => reassign(setUsher, usher, pick),
    reassignFlowerFamily: (pick: RoleAssignment) => reassign(setFlowerFamily, flowerFamily, pick),

    submit,
  };
}
