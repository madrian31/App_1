export interface Tithe {
  id: string;

  /** Firestore `members` doc id — "" for an anonymous / non-member giver. */
  memberId: string;
  memberName: string; // denormalized for fast table/report rendering

  date: string; // ISO date string, e.g. "2026-10-18" — typically a Sunday
  amount: number;
  notes: string;

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string; // ISO, set once on create
  dateModified: string; // ISO, updated on every edit
}

/** Shape used when saving a tithe — id/dateAdded/dateModified are derived by the service. */
export type NewTithe = Omit<Tithe, "id" | "dateAdded" | "dateModified">;
