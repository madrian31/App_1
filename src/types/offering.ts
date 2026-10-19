export type OfferingService = "Sunday" | "Wednesday";

/** The total offering collected at one service. Stored in the `offerings` collection,
 *  one doc per service date (doc id = the ISO date), so re-saving a date overwrites it. */
export interface Offering {
  id: string; // = date
  date: string; // ISO date, e.g. "2026-10-18"
  service: OfferingService;
  amount: number;

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string; // ISO, set once on first write
  dateModified: string; // ISO, updated on every edit
}

export type NewOffering = Omit<Offering, "id" | "dateAdded" | "dateModified">;
