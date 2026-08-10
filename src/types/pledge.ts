export interface Pledge {
  /** Deterministic: `${memberId}_${date}` — one slot per member per calendar day,
   *  so re-saving the same member+date safely overwrites instead of duplicating. */
  id: string;

  memberId: string; // Firestore `members` doc id — the source of truth
  memberName: string; // denormalized for fast table/report rendering

  date: string; // ISO date string, e.g. "2026-08-09" — typically a Sunday
  amount: number;
  notes: string;

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string; // ISO, set once on first write, preserved on later edits
  dateModified: string; // ISO, updated on every edit
}

/** Shape used when saving a pledge — id/dateAdded/dateModified are derived by the service. */
export type NewPledge = Omit<Pledge, "id" | "dateAdded" | "dateModified">;
