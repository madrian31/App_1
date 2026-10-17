/** Formats a Date as "YYYY-MM-DD" using LOCAL date parts — NOT toISOString(),
 *  which converts to UTC first and rolls the date back by one day for
 *  timezones ahead of UTC (e.g. PHT, UTC+8) between local midnight and 8 AM. */
export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Normalizes a stored date string to "YYYY-MM-DD". Accepts ISO dates as well as
 *  legacy display strings like "Oct 17, 2026". Returns "" if unparseable. */
export function normalizeToISODate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  const iso = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const d = new Date(value); // legacy strings parse as local midnight
  return isNaN(d.getTime()) ? "" : toLocalISODate(d);
}

/** "2026-10-17" (or a legacy "Oct 17, 2026") → "Oct 17, 2026". */
export function formatDisplayDate(value: unknown): string {
  const iso = normalizeToISODate(value);
  if (!iso) return typeof value === "string" ? value : "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
