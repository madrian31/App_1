export type CalendarCategory =
  | "events"
  | "activities"
  | "birthdays"
  | "anniversaries"
  | "meetings"
  | "holidays"
  | "graduation"
  | "celebrations"
  | "announcements";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  start: string; // HH:MM 24h
  end: string; // HH:MM 24h
  cat: CalendarCategory;
  location?: string;
}

export type CalendarView = "month" | "week" | "day" | "agenda";

export type DateFilterKey = "all" | "today" | "week" | "month" | "custom";

export interface CategoryMeta {
  label: string;
  icon: string; // Font Awesome class
  color: string;
  soft: string;
  border: string;
}

export const CATEGORIES: Record<CalendarCategory, CategoryMeta> = {
  events: { label: "Events", icon: "fa-solid fa-calendar-day", color: "#a15a1f", soft: "#fdf1e3", border: "#f0d2ad" },
  activities: { label: "Activities", icon: "fa-solid fa-person-running", color: "#2f6b47", soft: "#e6f2ea", border: "#bfe0cc" },
  birthdays: { label: "Birthdays", icon: "fa-solid fa-cake-candles", color: "#a6335a", soft: "#fbe9ef", border: "#f0c4d5" },
  anniversaries: { label: "Anniversaries", icon: "fa-solid fa-ring", color: "#4b48b0", soft: "#eeeefb", border: "#cfcff2" },
  meetings: { label: "Meetings", icon: "fa-solid fa-note-sticky", color: "#237070", soft: "#e6f4f4", border: "#bfe1e1" },
  holidays: { label: "Holidays", icon: "fa-solid fa-umbrella-beach", color: "#9a7300", soft: "#fbf3d8", border: "#eddb9c" },
  graduation: { label: "Graduation", icon: "fa-solid fa-graduation-cap", color: "#654a91", soft: "#f0eaf7", border: "#dcd0ec" },
  celebrations: { label: "Celebrations", icon: "fa-solid fa-champagne-glasses", color: "#a2377d", soft: "#f9e8f2", border: "#eec2df" },
  announcements: { label: "Announcements", icon: "fa-solid fa-bullhorn", color: "#3f688a", soft: "#e9f0f5", border: "#c8dbe8" },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CalendarCategory[];

export const DATE_FILTERS: { key: DateFilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "custom", label: "Custom Range" },
];

export type FilterChip =
  | { type: "search" }
  | { type: "cat"; key: CalendarCategory }
  | { type: "date" };

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];