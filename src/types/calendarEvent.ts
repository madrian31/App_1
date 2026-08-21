export interface CalendarCategoryItem {
  id: string;
  label: string;
  icon: string; // Font Awesome class, e.g. "fa-solid fa-cake-candles"
  color: string; // hex, e.g. "#a15a1f"
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  start: string; // HH:MM 24h
  end: string; // HH:MM 24h
  allDay?: boolean;
  cat: string; // references a CalendarCategoryItem id
  location?: string;
}

export type CalendarView = "month" | "week" | "day" | "agenda";

export type DateFilterKey = "all" | "today" | "week" | "month" | "custom";

export type FilterChip = { type: "search" } | { type: "cat"; key: string } | { type: "date" };

/**
 * Seed categories — written to Firestore once on first load if the
 * calendarCategories collection is empty (see calendarCategoriesService).
 * After that, Firestore is the source of truth; categories can be added,
 * renamed, recolored, or removed through the Category Manager.
 */
export const DEFAULT_CATEGORIES: CalendarCategoryItem[] = [
  { id: "events", label: "Events", icon: "fa-solid fa-calendar-day", color: "#a15a1f" },
  { id: "activities", label: "Activities", icon: "fa-solid fa-person-running", color: "#2f6b47" },
  { id: "birthdays", label: "Birthdays", icon: "fa-solid fa-cake-candles", color: "#a6335a" },
  { id: "anniversaries", label: "Anniversaries", icon: "fa-solid fa-ring", color: "#4b48b0" },
  { id: "meetings", label: "Meetings", icon: "fa-solid fa-note-sticky", color: "#237070" },
  { id: "holidays", label: "Holidays", icon: "fa-solid fa-umbrella-beach", color: "#9a7300" },
  { id: "graduation", label: "Graduation", icon: "fa-solid fa-graduation-cap", color: "#654a91" },
  { id: "celebrations", label: "Celebrations", icon: "fa-solid fa-champagne-glasses", color: "#a2377d" },
  { id: "announcements", label: "Announcements", icon: "fa-solid fa-bullhorn", color: "#3f688a" },
];

/** Shown for an event whose category was deleted after the event was created. */
export const FALLBACK_CATEGORY: CalendarCategoryItem = {
  id: "uncategorized",
  label: "Uncategorized",
  icon: "fa-solid fa-circle-question",
  color: "#8a8a8a",
};

export function findCategory(categories: CalendarCategoryItem[], id: string): CalendarCategoryItem {
  return categories.find((c) => c.id === id) ?? FALLBACK_CATEGORY;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const bigint = parseInt(full, 16);
  if (isNaN(bigint)) return `rgba(138, 138, 138, ${alpha})`;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Soft tinted background for badges/chips, derived from the category's base color
 *  so newly-added categories automatically get a matching soft/border pair
 *  without the user having to pick three colors instead of one. */
export function categorySoftBg(color: string): string {
  return hexToRgba(color, 0.14);
}

export function categoryBorder(color: string): string {
  return hexToRgba(color, 0.35);
}

export const DATE_FILTERS: { key: DateFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom Range" },
];

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];