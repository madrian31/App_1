export const LOAD_ERROR_TEXT = "Could not load this section. Please refresh the page.";

function parseISO(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/** "2026-10-18" → "Oct 18" */
export function fmtShortDate(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** "2026-10-21" → "Wednesday, Oct 21" */
export function fmtLongDate(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

/** "2026-10-21" → "Wed, Oct 21" */
export function fmtDayDate(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Today" / "Tomorrow" when `iso` is one of those days relative to `today`, otherwise null. */
export function relativeDay(iso: string, today: Date): string | null {
  const days = Math.round((parseISO(iso).getTime() - today.getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return null;
}
