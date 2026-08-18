export type ProgramType = "traditional" | "contemporary" | "prayerMeeting";

export interface RoleAssignment {
  id: string; // memberId or category string
  name: string; // denormalized display name
}

export interface ProgramLineUpEntry {
  /** Deterministic: the ISO date itself — one lineup per service date. */
  id: string;
  date: string; // ISO date
  programType: ProgramType;

  presider: RoleAssignment;
  speaker: RoleAssignment;
  specialNumber?: RoleAssignment; // category-based, Sunday only
  usher?: RoleAssignment; // category-based, Sunday only
  flowerFamily?: RoleAssignment; // Sunday only

  // ── Free-text fields — typed in manually per date, not rotation-based ──
  themeTitle?: string; // e.g. "Guided by God's Wisdom"
  themeVerse?: string; // e.g. "Psalms 25:4-5"
  announcements?: string; // flower family thank-you, visitor greetings, birthdays/anniversaries note, etc.

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string;
  dateModified: string;
}

export type NewProgramLineUpEntry = Omit<ProgramLineUpEntry, "dateModified">;

/** 1st Sunday of the month -> traditional, other Sundays -> contemporary,
 *  Wednesday -> prayerMeeting. Any other weekday defaults to contemporary
 *  (shouldn't normally happen, but keeps the function total). */
export function resolveProgramType(dateISO: string): ProgramType {
  const d = new Date(`${dateISO}T00:00:00`);
  const day = d.getDay(); // 0 = Sunday, 3 = Wednesday
  if (day === 3) return "prayerMeeting";
  if (day === 0) {
    const isFirstSunday = d.getDate() <= 7;
    return isFirstSunday ? "traditional" : "contemporary";
  }
  return "contemporary";
}

/** Which Sunday of the month `dateISO` falls on (1st, 2nd, 3rd...), or 0 if
 *  it isn't a Sunday at all. Used for rules like "Tangkilik only on the 2nd
 *  Sunday" that don't map cleanly onto traditional/contemporary. */
export function sundayOccurrenceInMonth(dateISO: string): number {
  const d = new Date(`${dateISO}T00:00:00`);
  if (d.getDay() !== 0) return 0;
  return Math.floor((d.getDate() - 1) / 7) + 1;
}