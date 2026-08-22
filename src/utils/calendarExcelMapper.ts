import * as XLSX from "xlsx";

/**
 * A row parsed from the Calendar of Activities spreadsheet, shaped to slot
 * straight into calendarEventsService.bulkAddEvents once `categoryLabel` is
 * resolved to a real category id (done by useCalendarImport, since that's
 * the only place that knows what categories already exist in Firestore).
 */
export interface ImportedCalendarEvent {
  title: string;
  date: string; // ISO yyyy-mm-dd
  start: string;
  end: string;
  allDay: boolean;
  categoryLabel: string; // raw text from the CATEGORY column
  inCharge?: string;
  location?: string;
  budget?: string;
}

export interface ParsedCalendarRow {
  rowNumber: number; // 1-based spreadsheet row, for error reporting
  data: ImportedCalendarEvent;
}

export interface CalendarParseResult {
  rows: ParsedCalendarRow[];
  skipped: { rowNumber: number; reason: string }[];
  /** Distinct CATEGORY values seen, in first-seen order. */
  categoryLabels: string[];
}

const HEADER_ALIASES: Record<string, string> = {
  DATE: "date",
  ACTIVITY: "activity",
  "IN-CHARGE": "inCharge",
  "IN CHARGE": "inCharge",
  PLACE: "place",
  VENUE: "place",
  "ALLOCATED BUDGET": "budget",
  BUDGET: "budget",
  CATEGORY: "category",
  COLOR: "category",
};

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
const MONTH_ABBR: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function toText(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}
function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}
function isoFrom(year: number, monthIdx: number, day: number): string {
  return `${year}-${pad(monthIdx + 1)}-${pad(day)}`;
}
function normalizeHeader(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Detects a section-header row like "JUNE 2026" that announces the month for
 * the rows below it — the church's calendar groups activities under one of
 * these per month instead of repeating the month on every row.
 */
function matchMonthHeader(rowText: string): { monthIdx: number; year: number } | null {
  const m = rowText
    .toUpperCase()
    .match(/(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{4})/);
  if (!m) return null;
  return { monthIdx: MONTH_NAMES.indexOf(m[1]), year: parseInt(m[2], 10) };
}

/**
 * Parses a DATE cell against the current month/year context established by
 * the most recent section header. Handles the shapes actually used in this
 * calendar: a real Excel date, a plain day number ("21"), a day with weekday
 * text ("21 Sun"), a same-month day range ("13-17"), and a cross-month range
 * that names both months ("Apr 26 - May 1"). Returns start/end ISO dates;
 * equal for single-day rows.
 */
function parseDateCell(
  raw: unknown,
  ctx: { monthIdx: number; year: number } | null
): { startIso: string; endIso: string } | null {
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const iso = `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}`;
    return { startIso: iso, endIso: iso };
  }

  const text = toText(raw);
  if (!text) return null;

  // Cross-month range, e.g. "Apr 26 - May 1"
  const crossMonth = text.match(/([A-Za-z]{3,9})\s*(\d{1,2})\s*[-–]\s*([A-Za-z]{3,9})\s*(\d{1,2})/);
  if (crossMonth) {
    const m1 = MONTH_ABBR[crossMonth[1].slice(0, 3).toUpperCase()];
    const m2 = MONTH_ABBR[crossMonth[3].slice(0, 3).toUpperCase()];
    const d1 = parseInt(crossMonth[2], 10);
    const d2 = parseInt(crossMonth[4], 10);
    if (m1 !== undefined && m2 !== undefined && ctx) {
      // Assumes the range doesn't cross a year boundary (Dec -> Jan) —
      // doesn't occur anywhere in this calendar's data.
      return { startIso: isoFrom(ctx.year, m1, d1), endIso: isoFrom(ctx.year, m2, d2) };
    }
  }

  if (!ctx) return null;

  // Same-month day range, e.g. "13-17" or "26 - 30"
  const range = text.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  if (range) {
    return {
      startIso: isoFrom(ctx.year, ctx.monthIdx, parseInt(range[1], 10)),
      endIso: isoFrom(ctx.year, ctx.monthIdx, parseInt(range[2], 10)),
    };
  }

  // Plain day, optionally followed by weekday text, e.g. "21 Sun" or "6 Sat"
  const single = text.match(/^(\d{1,2})/);
  if (single) {
    const iso = isoFrom(ctx.year, ctx.monthIdx, parseInt(single[1], 10));
    return { startIso: iso, endIso: iso };
  }

  return null;
}

/** Expands a start/end range into one ISO date per day, capped at 31 days
 *  so a bad parse can't silently explode into thousands of rows. */
function enumerateDates(startIso: string, endIso: string): string[] {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return [startIso];
  const out: string[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    if (out.length >= 31) break;
  }
  return out;
}

function findHeaderRowIndex(rows: unknown[][], maxScanRows = 5): number {
  for (let i = 0; i < Math.min(maxScanRows, rows.length); i++) {
    const cells = rows[i].map((c) => normalizeHeader(toText(c)));
    if (cells.includes("DATE") && cells.includes("ACTIVITY")) return i;
  }
  return -1;
}

export function parseCalendarSheet(rows: unknown[][]): CalendarParseResult {
  const headerIdx = findHeaderRowIndex(rows);
  if (headerIdx === -1) {
    throw new Error('Could not find a header row with "DATE" and "ACTIVITY" columns in the first 5 rows.');
  }

  const headers = rows[headerIdx].map((c) => normalizeHeader(toText(c)));
  const colIndex: Record<string, number> = {};
  headers.forEach((h, idx) => {
    const key = HEADER_ALIASES[h];
    if (key && colIndex[key] === undefined) colIndex[key] = idx;
  });

  if (colIndex.date === undefined || colIndex.activity === undefined) {
    throw new Error('Missing required "DATE" or "ACTIVITY" column.');
  }

  const parsedRows: ParsedCalendarRow[] = [];
  const skipped: { rowNumber: number; reason: string }[] = [];
  const categoryLabelsSeen: string[] = [];
  let ctx: { monthIdx: number; year: number } | null = null;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const rowNumber = i + 1; // matches the row number you'd see in Excel
    if (row.every((c) => toText(c) === "")) continue; // blank row, skip silently

    const rowText = row.map((c) => toText(c)).join(" ");
    const monthMatch = matchMonthHeader(rowText);
    // A section-header row repeats the month across the row and has no real
    // activity text — treat it as context for the rows below, not data.
    if (monthMatch && !toText(row[colIndex.activity])) {
      ctx = monthMatch;
      continue;
    }

    const activity = toText(row[colIndex.activity]);
    if (!activity) {
      skipped.push({ rowNumber, reason: "Missing Activity" });
      continue;
    }

    const parsedDate = parseDateCell(row[colIndex.date], ctx);
    if (!parsedDate) {
      skipped.push({
        rowNumber,
        reason: ctx
          ? "Could not read the Date column"
          : "No month section header (e.g. \"JUNE 2026\") found above this row",
      });
      continue;
    }

    const category = colIndex.category !== undefined ? toText(row[colIndex.category]) : "";
    const categoryLabel = category || "Uncategorized";
    if (!categoryLabelsSeen.includes(categoryLabel)) categoryLabelsSeen.push(categoryLabel);

    const inCharge = colIndex.inCharge !== undefined ? toText(row[colIndex.inCharge]) : "";
    const place = colIndex.place !== undefined ? toText(row[colIndex.place]) : "";
    const budget = colIndex.budget !== undefined ? toText(row[colIndex.budget]) : "";

    enumerateDates(parsedDate.startIso, parsedDate.endIso).forEach((iso) => {
      parsedRows.push({
        rowNumber,
        data: {
          title: activity,
          date: iso,
          start: "00:00",
          end: "23:59",
          allDay: true,
          categoryLabel,
          inCharge: inCharge || undefined,
          location: place || undefined,
          budget: budget || undefined,
        },
      });
    });
  }

  return { rows: parsedRows, skipped, categoryLabels: categoryLabelsSeen };
}

export async function parseCalendarFile(file: File): Promise<CalendarParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
  return parseCalendarSheet(rows);
}
