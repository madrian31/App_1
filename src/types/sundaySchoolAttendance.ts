export interface SundaySchoolAttendanceRecord {
  /** Deterministic: "{year}-{month}" (month is zero-indexed, matching the UI's viewMonth
   *  and JS Date conventions) — one doc per month, safe to re-save/edit like the lineup docs. */
  id: string;

  /** childId -> day-of-month -> present. Nested map so a single toggle only touches
   *  one leaf field when merged (see sundaySchoolAttendanceService.setAttendance). */
  records: Record<string, Record<number, boolean>>;

  // ── System / meta fields ──
  addedBy?: string;
  dateAdded?: string; // ISO, set once on first write
  dateModified?: string; // ISO, updated on every edit
}
