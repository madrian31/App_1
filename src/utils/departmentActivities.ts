import type { CalendarEvent } from "../types/calendarEvent";
import type { Department } from "../types/department";
import { toLocalISODate } from "./date";

/** One activity from the Calendar, as Finance → Department Funds sees it. An activity that runs
 *  several days is several calendar events (one per day) shown as one, so its budget counts once. */
export interface DepartmentActivity {
  key: string; // id of its first day's event — what cash records link to (DepartmentFund.eventId)
  eventIds: string[]; // every day's event, oldest first
  title: string;
  dateFrom: string; // ISO
  dateTo: string; // ISO — same as dateFrom for a one-day activity
  location: string;
  inCharge: string;
  departmentId: string; // "" when it has no department
  /** "set" = picked in Department Funds; "matched" = found in the IN-CHARGE text; "none" = no department. */
  departmentSource: "set" | "matched" | "none";
  budget: number | null; // null when no budget has been set
  /** Spreadsheet budget text that isn't a plain amount (e.g. "TBA"), shown as a hint; "" otherwise. */
  budgetText: string;
}

/** "₱5,000.00", "PHP 5000", "P5,000" → 5000. Anything else ("TBA", "5k", "3,000/day") → null. */
export function parseBudgetText(text: string | undefined): number | null {
  if (!text) return null;
  const cleaned = text.trim().replace(/^(₱|php|p)\s*/i, "").replace(/[,\s]/g, "");
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
}

// Words that don't tell departments apart: "Youth Dept." and "YOUTH MINISTRY" are the same department.
const FILLER = new Set(["dept", "department", "ministry", "the", "of", "and"]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/['’]s\b/g, "") // "Men's" → "men"
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((w) => (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w)) // "Mens" → "men"
    .filter((w) => w && !FILLER.has(w));
}

/** The department named in an IN-CHARGE text ("YOUTH DEPT. – Bro. Juan" → Youth Dept.), or "" when
 *  none or more than one fits ("Men & Women"). Whole words only, so "Women" never matches "Men". */
export function matchDepartment(inCharge: string | undefined, departments: Department[]): string {
  if (!inCharge) return "";
  const have = new Set(words(inCharge));
  let best: { id: string; size: number } | null = null;
  let tie = false;
  for (const d of departments) {
    const need = words(d.name);
    if (need.length === 0 || !need.every((w) => have.has(w))) continue;
    // The more specific name wins: "Youth Music" over "Youth" for "Youth Music Team".
    if (!best || need.length > best.size) {
      best = { id: d.id, size: need.length };
      tie = false;
    } else if (need.length === best.size) {
      tie = true;
    }
  }
  return best && !tie ? best.id : "";
}

function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return toLocalISODate(d);
}

/** Turns calendar events into activities: the same activity on back-to-back days becomes one. */
export function groupActivities(events: CalendarEvent[], departments: Department[]): DepartmentActivity[] {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
  const lastBySignature = new Map<string, DepartmentActivity>();
  const activities: DepartmentActivity[] = [];

  for (const ev of sorted) {
    // Days of one activity share every one of these (the import copies them to each day,
    // and edits here are written to every day).
    const signature = [
      ev.title.trim().toLowerCase(),
      ev.inCharge ?? "",
      ev.budget ?? "",
      ev.departmentId ?? "~",
      ev.allocatedBudget ?? "~",
    ].join("|");
    const prev = lastBySignature.get(signature);
    if (prev && (ev.date === prev.dateTo || ev.date === nextDay(prev.dateTo))) {
      prev.eventIds.push(ev.id);
      prev.dateTo = ev.date;
      continue;
    }

    const explicit = ev.departmentId !== undefined;
    const departmentId = explicit ? ev.departmentId ?? "" : matchDepartment(ev.inCharge, departments);
    const textBudget = parseBudgetText(ev.budget);
    const hasNumber = typeof ev.allocatedBudget === "number";
    const activity: DepartmentActivity = {
      key: ev.id,
      eventIds: [ev.id],
      title: ev.title,
      dateFrom: ev.date,
      dateTo: ev.date,
      location: ev.location ?? "",
      inCharge: ev.inCharge ?? "",
      departmentId,
      departmentSource: !departmentId ? "none" : explicit ? "set" : "matched",
      budget: hasNumber ? ev.allocatedBudget ?? null : textBudget,
      budgetText: !hasNumber && textBudget === null ? (ev.budget ?? "").trim() : "",
    };
    lastBySignature.set(signature, activity);
    activities.push(activity);
  }

  return activities;
}
