import type { CalendarEvent } from "../types/calendarEvent";

/**
 * Philippine holidays, copied from the Palace proclamations published in the
 * Official Gazette. The Gazette has no API the app can call, so this list is
 * kept up to date by hand:
 *  - once a year, when the next year's holiday proclamation comes out
 *    (usually around September);
 *  - when Eid'l Fitr and Eid'l Adha are proclaimed, since their dates follow
 *    the Islamic calendar and are announced separately each time.
 *
 * Only days off are listed — special working days (e.g. EDSA Anniversary)
 * are left out. Shown read-only on the calendar, like birthdays; nothing is
 * written to Firestore.
 */
const HOLIDAYS: { date: string; name: string }[] = [
  // ── 2026 · Proclamation No. 1006, s. 2025 ──
  // Regular holidays
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-04-02", name: "Maundy Thursday" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-09", name: "Araw ng Kagitingan" },
  { date: "2026-05-01", name: "Labor Day" },
  { date: "2026-06-12", name: "Independence Day" },
  { date: "2026-08-31", name: "National Heroes Day" },
  { date: "2026-11-30", name: "Bonifacio Day" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-30", name: "Rizal Day" },
  { date: "2026-03-20", name: "Eid'l Fitr" }, // Proclamation No. 1189, s. 2026
  { date: "2026-05-27", name: "Eid'l Adha" }, // Proclamation No. 1264, s. 2026
  // Special (non-working) days
  { date: "2026-08-21", name: "Ninoy Aquino Day" },
  { date: "2026-11-01", name: "All Saints' Day" },
  { date: "2026-12-08", name: "Feast of the Immaculate Conception of Mary" },
  { date: "2026-12-31", name: "Last Day of the Year" },
  // Additional special (non-working) days
  { date: "2026-02-17", name: "Chinese New Year" },
  { date: "2026-04-04", name: "Black Saturday" },
  { date: "2026-11-02", name: "All Souls' Day" },
  { date: "2026-12-24", name: "Christmas Eve" },

  // ── 2027 · Proclamation No. 1427, s. 2026 ──
  // Eid'l Fitr and Eid'l Adha not yet proclaimed — add them once announced.
  // Regular holidays
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-03-25", name: "Maundy Thursday" },
  { date: "2027-03-26", name: "Good Friday" },
  { date: "2027-04-09", name: "Araw ng Kagitingan" },
  { date: "2027-05-01", name: "Labor Day" },
  { date: "2027-06-12", name: "Independence Day" },
  { date: "2027-08-30", name: "National Heroes Day" },
  { date: "2027-11-30", name: "Bonifacio Day" },
  { date: "2027-12-25", name: "Christmas Day" },
  { date: "2027-12-30", name: "Rizal Day" },
  // Special (non-working) days
  { date: "2027-08-21", name: "Ninoy Aquino Day" },
  { date: "2027-11-01", name: "All Saints' Day" },
  { date: "2027-12-08", name: "Feast of the Immaculate Conception of Mary" },
  { date: "2027-12-31", name: "Last Day of the Year" },
  // Additional special (non-working) days
  { date: "2027-02-06", name: "Chinese New Year" },
  { date: "2027-03-27", name: "Black Saturday" },
  { date: "2027-11-02", name: "All Souls' Day" },
  { date: "2027-12-24", name: "Christmas Eve" },
];

/** Matches the seeded "Holidays" calendar category id (see DEFAULT_CATEGORIES). */
export const HOLIDAY_CATEGORY_ID = "holidays";

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const PH_HOLIDAYS: CalendarEvent[] = HOLIDAYS.map(({ date, name }) => ({
  // "virtual-" keeps the calendar from opening it in the edit form.
  id: `virtual-holiday-${date}-${slug(name)}`,
  title: name,
  date,
  start: "00:00",
  end: "23:59",
  allDay: true,
  cat: HOLIDAY_CATEGORY_ID,
}));

/**
 * The holidays above, minus any date that already has a Holidays-category
 * event entered by hand — so a manual entry can correct or replace one.
 */
export function phHolidaysExcept(events: CalendarEvent[]): CalendarEvent[] {
  const manualDates = new Set(events.filter((e) => e.cat === HOLIDAY_CATEGORY_ID).map((e) => e.date));
  return PH_HOLIDAYS.filter((h) => !manualDates.has(h.date));
}
