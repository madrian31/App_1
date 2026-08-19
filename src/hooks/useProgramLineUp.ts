import { useEffect, useMemo, useState } from "react";
import { getAllMembers } from "../services/members/memberService/membersService";
import {
  getRotationQueue,
  seedRotationQueueIfEmpty,
  advanceRotationQueue,
  syncRotationQueueItems,
} from "../services/rotationQueue/rotationQueueService";
import { getLineUpForDate, saveLineUp } from "../services/programLineUp/programLineUpService";
import { getLookupList, seedLookupListIfEmpty } from "../services/settings/lookupListsService";
import { getThemePresets } from "../services/settings/themePresetsService";
import { resolveProgramType } from "../types/programLineUp";
import type { ProgramType, RoleAssignment } from "../types/programLineUp";
import type { RotationRole } from "../types/rotationQueue";
import type { ThemePreset } from "../types/themePreset";
import { getMonthlyCelebrants, isCouncilPoolMember, isWorkerPoolMember, isWedPresiderPoolMember } from "../types/member";
import type { Member, MonthlyCelebrant } from "../types/member";

// Same default set used to seed the "category" lookup list on the Settings
// page (useLookupLists.ts) — only used here as a one-time fallback if that
// list hasn't been seeded yet. The lookup list itself is the source of
// truth from then on, so editing it in Manage Lists updates Usher and
// Special Number options everywhere, including here.
const DEFAULT_CATEGORIES = ["Men", "Women", "Youth Boys", "Youth Girls", "Young Adult/Young Professional"];

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

export default function useProgramLineUp(currentUser: string, initialDate?: string) {
  const [date, setDate] = useState(initialDate || nextServiceDate());
  const programType: ProgramType = resolveProgramType(date);

  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Theme presets — managed in Manage Lists, rotate the same way as the
  // other roles: front of queue is the "next" one, advances to the back
  // once used (see submit() below).
  const [themePresets, setThemePresets] = useState<ThemePreset[]>([]);
  const [loadingThemePresets, setLoadingThemePresets] = useState(true);

  const [presider, setPresider] = useState<RoleState>(EMPTY_ROLE);
  const [speaker, setSpeaker] = useState<RoleState>(EMPTY_ROLE);
  const [specialNumber, setSpecialNumber] = useState<RoleState>(EMPTY_ROLE);
  const [usher, setUsher] = useState<RoleState>(EMPTY_ROLE);
  const [flowerFamily, setFlowerFamily] = useState<RoleState>(EMPTY_ROLE);

  const [themeTitle, setThemeTitleState] = useState("");
  const [themeVerse, setThemeVerseState] = useState("");
  // Which preset (if any) is currently backing the Theme fields — cleared the
  // moment the user edits either field by hand, so a manually-tweaked theme
  // never advances a preset it no longer matches.
  const [themePresetId, setThemePresetId] = useState<string | null>(null);
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

  useEffect(() => {
    setLoadingCategories(true);
    seedLookupListIfEmpty("category", DEFAULT_CATEGORIES)
      .then(() => getLookupList("category"))
      .then(setCategoryOptions)
      .catch((err) => console.error("Failed to load category list:", err))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    setLoadingThemePresets(true);
    getThemePresets()
      .then(setThemePresets)
      .catch((err) => console.error("Failed to load theme presets:", err))
      .finally(() => setLoadingThemePresets(false));
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

  /** Same idea as loadRole, but for sources (like theme presets) that can
   *  gain new entries AFTER the queue doc already exists — syncs any new
   *  ids onto the back instead of only seeding once on an empty doc. */
  async function syncThemePresetQueue(validIds: string[]): Promise<RoleState> {
    const items = await syncRotationQueueItems("themePreset", validIds);
    return buildRoleState(items, (id) => id); // resolver unused — title/verse resolved separately below
  }

  // Reload everything whenever the date (and therefore programType) or the
  // member list changes. If a lineup already exists for this date, its saved
  // assignments override the "front of queue" default (so re-opening an
  // already-scheduled date shows what was actually saved, not a fresh pick).
  useEffect(() => {
    if (loadingMembers || loadingCategories || loadingThemePresets) return;
    let cancelled = false;
    setLoadingEntry(true);

    async function run() {
      const councilIds = members.filter(isCouncilPoolMember).map((m) => m.id);
      const workerIds = members.filter(isWorkerPoolMember).map((m) => m.id);
      // Wednesday Presider pool: Youth OR Council Member, but NEVER a Worker
      // — even if that person is also Youth and/or Council.
      const wedPresiderPoolIds = members.filter(isWedPresiderPoolMember).map((m) => m.id);
      const themePresetIds = themePresets.map((p) => p.id);

      const [presiderQ, speakerQ, specialNumberQ, usherQ, flowerQ, themeQ, existing] = await Promise.all([
        loadRole("presiderCouncil", councilIds, nameOf),
        loadRole("speakerWorker", workerIds, nameOf),
        loadRole("specialNumberCategory", categoryOptions, (id) => id),
        loadRole("usherCategory", categoryOptions, (id) => id),
        loadRole("flowerFamily", [], (id) => id), // family list has no auto-seed yet — added manually for now
        syncThemePresetQueue(themePresetIds),
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

      // Theme: a saved entry's text always wins (never re-linked to a preset,
      // since we don't persist which preset produced it). Otherwise, auto-fill
      // from the front of the theme preset queue, if one exists.
      if (existing?.themeTitle) {
        setThemeTitleState(existing.themeTitle);
        setThemeVerseState(existing.themeVerse ?? "");
        setThemePresetId(null);
      } else if (themeQ.current) {
        const preset = themePresets.find((p) => p.id === themeQ.current!.id);
        setThemeTitleState(preset?.title ?? "");
        setThemeVerseState(preset?.verse ?? "");
        setThemePresetId(preset ? preset.id : null);
      } else {
        setThemeTitleState("");
        setThemeVerseState("");
        setThemePresetId(null);
      }

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
  }, [date, programType, loadingMembers, loadingCategories, loadingThemePresets, members, categoryOptions, themePresets]);

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
    () => members.filter(isCouncilPoolMember).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
    [members]
  );
  const workerPool: RoleAssignment[] = useMemo(
    () => members.filter(isWorkerPoolMember).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
    [members]
  );
  const wedPresiderPool: RoleAssignment[] = useMemo(
    () => members.filter(isWedPresiderPoolMember).map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
    [members]
  );
  const usherPool: RoleAssignment[] = categoryOptions.map((c) => ({ id: c, name: c }));
  const specialNumberPool: RoleAssignment[] = categoryOptions.map((c) => ({ id: c, name: c }));
  // Search pool for assigning one or more specific members to Special
  // Number, as an alternative to picking a whole category.
  const specialNumberMemberPool: RoleAssignment[] = useMemo(
    () => members.map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })),
    [members]
  );

  /** Presider pool depends on the day: Wednesday uses the Youth/Council mix,
   *  Sunday uses plain Council. Speaker is the mirror — Council on
   *  Wednesday, Worker on Sunday. */
  const presiderPool = programType === "prayerMeeting" ? wedPresiderPool : councilPool;
  const speakerPool = programType === "prayerMeeting" ? councilPool : workerPool;

  /** Manual override — pick anyone from the pool regardless of queue order. */
  function reassign(roleSetter: (s: RoleState) => void, current: RoleState, pick: RoleAssignment) {
    roleSetter({ current: pick, upNext: current.upNext });
  }

  /** Wrapped setters — any manual edit to the theme fields breaks the link to
   *  whichever preset auto-filled them, so submit() won't advance a preset
   *  the saved theme no longer actually matches. */
  function setThemeTitle(value: string) {
    setThemeTitleState(value);
    setThemePresetId(null);
  }
  function setThemeVerse(value: string) {
    setThemeVerseState(value);
    setThemePresetId(null);
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
      if (specialNumber.current && categoryOptions.includes(specialNumber.current.id)) {
        advances.push(["specialNumberCategory", specialNumber.current.id]);
      }
      if (usher.current) advances.push(["usherCategory", usher.current.id]);
      if (flowerFamily.current) advances.push(["flowerFamily", flowerFamily.current.id]);
      // Only advance the theme preset queue if the saved theme still matches
      // the preset that auto-filled it — an edited theme doesn't "use up" a
      // preset it no longer represents.
      if (themePresetId) advances.push(["themePreset", themePresetId]);

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
    loading: loadingMembers || loadingCategories || loadingThemePresets || loadingEntry,
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
    specialNumberMemberPool,
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