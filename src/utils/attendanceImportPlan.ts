import type { Member } from "../types/member";
import {
  createMemberMatcher,
  isLikelySamePerson,
  normalizeImportedName,
  type MemberMatch,
  type NormalizedName,
  type ParsedAttendanceSheet,
} from "./attendanceExcelMapper";

/**
 * Pure (no Firestore) planning for the attendance import:
 *  1. collapse every sheet row into one "person" per distinct name,
 *  2. pick a default resolution for each (existing member, new visitor, skip…),
 *  3. turn people + resolutions into the exact membersAttendance writes,
 *     diffed against what's already saved so only real changes are written.
 */

// ─────────────────────────────────────────────────────────────────────────────
// People
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportPerson {
  key: string;
  /** Spelling from the most recent month, shown in the preview. */
  displayName: string;
  /** Every distinct spelling seen across sheets. */
  spellings: string[];
  name: NormalizedName;
  /** monthKey -> Sunday -> present (only months where this name appears). */
  attendance: Record<string, Record<number, boolean>>;
  presentCount: number;
  match: MemberMatch;
  /** Index into the sorted month list of the newest month this name appears in. */
  latestMonth: number;
}

export type Resolution =
  | { kind: "member"; memberId: string }
  | { kind: "newVisitor" }
  | { kind: "sameAs"; personKey: string }
  | { kind: "skip" };

/** Why a default was picked — drives the "needs review" highlight in the preview. */
export type ResolutionNote =
  | "exactMember"
  | "suggestedMember"
  | "ambiguousMember"
  | "newVisitor"
  | "suggestedSameAs"
  | "noAttendance";

export interface PersonDefault {
  resolution: Resolution;
  note: ResolutionNote;
}

function personKeyOf(n: NormalizedName): string {
  return n.suffix ? `${n.key}|${n.suffix}` : n.key;
}

export function buildImportPeople(sheets: ParsedAttendanceSheet[], members: Member[]): ImportPerson[] {
  const matcher = createMemberMatcher(members);
  const people = new Map<string, ImportPerson>();

  sheets.forEach((sheet, monthIdx) => {
    for (const row of sheet.rows) {
      const name = normalizeImportedName(row.rawName);
      if (!name.key) continue;
      const key = personKeyOf(name);

      let p = people.get(key);
      if (!p) {
        p = {
          key,
          displayName: row.rawName,
          spellings: [],
          name,
          attendance: {},
          presentCount: 0,
          match: matcher(name),
          latestMonth: monthIdx,
        };
        people.set(key, p);
      }
      if (!p.spellings.includes(row.rawName)) p.spellings.push(row.rawName);
      if (monthIdx >= p.latestMonth) {
        p.latestMonth = monthIdx;
        p.displayName = row.rawName;
      }

      // Same name listed twice on one sheet: a check on either row counts.
      const monthDays = (p.attendance[sheet.monthKey] ??= {});
      for (const [d, present] of Object.entries(row.days)) {
        const day = Number(d);
        monthDays[day] = Boolean(monthDays[day]) || present;
      }
    }
  });

  for (const p of people.values()) {
    p.presentCount = Object.values(p.attendance).reduce(
      (sum, days) => sum + Object.values(days).filter(Boolean).length,
      0
    );
  }

  // Newest + most-present first: that's also the order defaults are assigned in,
  // so when two unmatched spellings look alike, the newer spelling becomes the visitor.
  return Array.from(people.values()).sort(
    (a, b) => b.latestMonth - a.latestMonth || b.presentCount - a.presentCount || a.displayName.localeCompare(b.displayName)
  );
}

export function defaultResolutions(people: ImportPerson[]): Record<string, PersonDefault> {
  const out: Record<string, PersonDefault> = {};
  const newVisitors: ImportPerson[] = [];

  for (const p of people) {
    if (p.match.kind === "exact" && p.match.member) {
      out[p.key] = { resolution: { kind: "member", memberId: p.match.member.id }, note: "exactMember" };
      continue;
    }
    if (p.match.kind === "suggested" && p.match.member) {
      out[p.key] = { resolution: { kind: "member", memberId: p.match.member.id }, note: "suggestedMember" };
      continue;
    }
    if (p.match.kind === "ambiguous") {
      out[p.key] = { resolution: { kind: "skip" }, note: "ambiguousMember" };
      continue;
    }
    if (p.presentCount === 0) {
      // Listed on the sheet but never checked in the imported months — no reason to create a visitor.
      out[p.key] = { resolution: { kind: "skip" }, note: "noAttendance" };
      continue;
    }
    const twin = newVisitors.find((v) => isLikelySamePerson(v.name, p.name));
    if (twin) {
      out[p.key] = { resolution: { kind: "sameAs", personKey: twin.key }, note: "suggestedSameAs" };
      continue;
    }
    newVisitors.push(p);
    out[p.key] = { resolution: { kind: "newVisitor" }, note: "newVisitor" };
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Write plan
// ─────────────────────────────────────────────────────────────────────────────

/** Prefix for visitors that don't have a Firestore id yet. */
export const NEW_VISITOR_PREFIX = "new:";

/** Follows "sameAs" links to the trackee id this person's attendance lands on, or null for skip. */
export function resolveTarget(
  personKey: string,
  resolutions: Record<string, Resolution>,
  seen: Set<string> = new Set()
): string | null {
  if (seen.has(personKey)) return null; // cycle guard
  seen.add(personKey);
  const r = resolutions[personKey];
  if (!r || r.kind === "skip") return null;
  if (r.kind === "member") return r.memberId;
  if (r.kind === "newVisitor") return `${NEW_VISITOR_PREFIX}${personKey}`;
  return resolveTarget(r.personKey, resolutions, seen);
}

export interface AttendanceWrite {
  trackeeId: string; // member id, or `new:<personKey>` until the visitor is created
  monthKey: string;
  year: number;
  month: number;
  /** Only the days that should be written (merge into the existing doc). */
  days: Record<number, boolean>;
  added: number;
  removed: number;
}

export interface ImportPlan {
  writes: AttendanceWrite[];
  newVisitorKeys: string[]; // person keys that will become new visitor docs
  membersTouched: number; // existing member/visitor docs that get attendance
  checksAdded: number;
  checksRemoved: number;
}

/** existing: trackeeId -> monthKey -> day -> present (what's in Firestore now). */
export type ExistingAttendance = Record<string, Record<string, Record<number, boolean>>>;

export function buildImportPlan(
  people: ImportPerson[],
  resolutions: Record<string, Resolution>,
  sheets: ParsedAttendanceSheet[],
  existing: ExistingAttendance,
  options: { keepExistingChecks: boolean }
): ImportPlan {
  const sheetByMonth = new Map(sheets.map((s) => [s.monthKey, s]));

  // trackeeId -> monthKey -> day -> present, combining everyone who maps to the same trackee.
  const incoming: ExistingAttendance = {};
  const newVisitorKeys = new Set<string>();

  for (const p of people) {
    const target = resolveTarget(p.key, resolutions);
    if (!target) continue;
    if (target.startsWith(NEW_VISITOR_PREFIX)) newVisitorKeys.add(target.slice(NEW_VISITOR_PREFIX.length));
    const byMonth = (incoming[target] ??= {});
    for (const [monthKey, days] of Object.entries(p.attendance)) {
      if (!sheetByMonth.has(monthKey)) continue;
      const merged = (byMonth[monthKey] ??= {});
      for (const [d, present] of Object.entries(days)) {
        const day = Number(d);
        merged[day] = Boolean(merged[day]) || present;
      }
    }
  }

  const writes: AttendanceWrite[] = [];
  let checksAdded = 0;
  let checksRemoved = 0;
  const touchedExisting = new Set<string>();

  for (const [trackeeId, byMonth] of Object.entries(incoming)) {
    for (const [monthKey, days] of Object.entries(byMonth)) {
      const sheet = sheetByMonth.get(monthKey)!;
      const current = existing[trackeeId]?.[monthKey] ?? {};
      const toWrite: Record<number, boolean> = {};
      let added = 0;
      let removed = 0;

      for (const [d, present] of Object.entries(days)) {
        const day = Number(d);
        const was = Boolean(current[day]);
        if (present && !was) {
          toWrite[day] = true;
          added++;
        } else if (!present && was && !options.keepExistingChecks) {
          toWrite[day] = false;
          removed++;
        }
      }

      if (added === 0 && removed === 0) continue;
      writes.push({ trackeeId, monthKey, year: sheet.year, month: sheet.month, days: toWrite, added, removed });
      checksAdded += added;
      checksRemoved += removed;
      if (!trackeeId.startsWith(NEW_VISITOR_PREFIX)) touchedExisting.add(trackeeId);
    }
  }

  return {
    writes,
    newVisitorKeys: Array.from(newVisitorKeys),
    membersTouched: touchedExisting.size,
    checksAdded,
    checksRemoved,
  };
}
