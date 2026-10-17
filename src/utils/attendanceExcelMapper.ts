import type { Member } from "../types/member";

/**
 * Parser + name matcher for the church's ATTENDANCE workbook.
 *
 * The workbook has one sheet per month per service. Only the Worship Service
 * sheets are imported here, because Members Attendance tracks Sundays only.
 * Prayer Meeting, Sunday School, Small Group, Simbang Gabi and Summary sheets
 * are ignored automatically (no "NAME" header grid, or excluded by name).
 *
 * Each Worship Service sheet looks like:
 *
 *   Month of  OCTOBER 2026
 *   NAME                      | 4    | 11   | 18   | 25   |      | REMARKS ...
 *   Pred. Ronaldo Macatumpag  | TRUE | TRUE | FALSE| FALSE|      | ...
 *   Abalos, Raquel            | FALSE| ...
 *
 * Only the "13 y.o and above" grid (the one with checkboxes) is read. The
 * "12 y.o and below" block lists kids' first names per Sunday, which can't be
 * matched reliably to anyone, so it's left out on purpose.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AttendanceSheetRow {
  rowNumber: number; // 1-based, as seen in Excel
  rawName: string; // exactly as typed in the sheet
  /** Sunday day-of-month -> present. Every Sunday column in the sheet has an entry. */
  days: Record<number, boolean>;
}

export interface ParsedAttendanceSheet {
  sheetName: string;
  year: number;
  month: number; // 0-indexed, same as JS Date and membersAttendance.month
  monthKey: string; // `${year}-${month}` — same key useAttendanceTracker uses
  label: string; // "October 2026"
  sundays: number[]; // Sundays actually read from this sheet, ascending
  rows: AttendanceSheetRow[];
  presentCount: number;
  warnings: string[];
}

export interface SkippedSheet {
  sheetName: string;
  reason: string;
}

export interface AttendanceWorkbookParseResult {
  sheets: ParsedAttendanceSheet[];
  skippedSheets: SkippedSheet[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Sheets whose name contains any of these are never treated as Sunday worship attendance. */
const EXCLUDED_SHEET_KEYWORDS = ["PRAYER", "SUNDAY SCHOOL", "SMALL GROUP", "SIMBANG", "SUMMARY"];

function toText(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function sundaysOf(year: number, month: number): number[] {
  const out: number[] = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    if (d.getDay() === 0) out.push(d.getDate());
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/** Finds "OCTOBER 2026" (any case, any spacing) inside a piece of text. */
function findMonthYear(text: string): { year: number; month: number } | null {
  const m = text.toUpperCase().match(new RegExp(`(${MONTH_NAMES.join("|")})\\s*(\\d{4})`));
  if (!m) return null;
  return { month: MONTH_NAMES.indexOf(m[1]), year: parseInt(m[2], 10) };
}

/** A header cell counts as a date column if it's a plain day number (4, "11") or a real Excel date. */
function headerDay(v: unknown): number | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v.getDate();
  if (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 31) return v;
  const t = toText(v);
  if (/^\d{1,2}$/.test(t)) {
    const n = parseInt(t, 10);
    return n >= 1 && n <= 31 ? n : null;
  }
  return null;
}

const PRESENT_TEXT = new Set(["true", "1", "/", "✓", "✔", "p", "present", "yes", "y"]);

function isPresent(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "number") return v === 1;
  return PRESENT_TEXT.has(toText(v).toLowerCase());
}

/** Name cells that are actually labels/totals, not people. */
function looksLikeLabel(name: string): boolean {
  const u = name.toUpperCase();
  return u === "NAME" || u.includes("TOTAL") || u.includes(":") || u.startsWith("MONTH OF") || u.startsWith("ATTENDANCE");
}

// ─────────────────────────────────────────────────────────────────────────────
// Sheet parsing
// ─────────────────────────────────────────────────────────────────────────────

function findHeader(rows: unknown[][]): { rowIdx: number; nameCol: number } | null {
  for (let r = 0; r < Math.min(rows.length, 20); r++) {
    const row = rows[r] ?? [];
    for (let c = 0; c < Math.min(row.length, 4); c++) {
      if (toText(row[c]).toUpperCase() === "NAME") return { rowIdx: r, nameCol: c };
    }
  }
  return null;
}

/** Picks the month whose Sundays best match the header day numbers. Prefers the
 *  "Month of …" label, then the sheet name — but a copy-pasted label (e.g. a May
 *  sheet still titled "MARCH 2026") loses to whichever candidate actually fits. */
function resolveMonth(
  candidates: { year: number; month: number; source: string }[],
  headerDays: number[]
): { year: number; month: number; source: string; score: number } | null {
  let best: { year: number; month: number; source: string; score: number } | null = null;
  for (const c of candidates) {
    const sundays = new Set(sundaysOf(c.year, c.month));
    const score = headerDays.filter((d) => sundays.has(d)).length;
    if (!best || score > best.score) best = { ...c, score };
  }
  return best;
}

function parseSheet(sheetName: string, rows: unknown[][]): ParsedAttendanceSheet | SkippedSheet {
  const header = findHeader(rows);
  if (!header) return { sheetName, reason: "No NAME header row found" };
  const { rowIdx, nameCol } = header;
  const headerRow = rows[rowIdx] ?? [];

  // Day columns run from the column after NAME up to the first "REMARKS" cell.
  type Col = { col: number; raw: unknown; day: number | null };
  const cols: Col[] = [];
  for (let c = nameCol + 1; c < headerRow.length; c++) {
    if (toText(headerRow[c]).toUpperCase().startsWith("REMARKS")) break;
    cols.push({ col: c, raw: headerRow[c], day: headerDay(headerRow[c]) });
  }
  const numericDays = cols.map((c) => c.day).filter((d): d is number => d !== null);
  if (numericDays.length === 0) return { sheetName, reason: "No Sunday date columns next to NAME" };

  // Month: from "Month of OCTOBER 2026" above the header, and from the sheet name.
  const candidates: { year: number; month: number; source: string }[] = [];
  for (let r = 0; r < rowIdx; r++) {
    const text = (rows[r] ?? []).slice(0, nameCol + 3).map(toText).join(" ");
    if (/MONTH OF/i.test(text)) {
      const my = findMonthYear(text);
      if (my) candidates.push({ ...my, source: "title" });
    }
  }
  const fromName = findMonthYear(sheetName);
  if (fromName) candidates.push({ ...fromName, source: "sheet name" });
  const resolved = resolveMonth(candidates, numericDays);
  if (!resolved || resolved.score === 0) {
    return { sheetName, reason: "Could not tell which month this sheet is for (date columns aren't Sundays)" };
  }

  const { year, month } = resolved;
  const label = `${MONTH_LABELS[month]} ${year}`;
  const warnings: string[] = [];
  if (resolved.source === "sheet name" && candidates.some((c) => c.source === "title")) {
    const title = candidates.find((c) => c.source === "title")!;
    if (title.year !== year || title.month !== month) {
      warnings.push(
        `Title says ${MONTH_LABELS[title.month]} ${title.year}, but the dates match ${label} — used ${label}.`
      );
    }
  }

  const monthSundays = sundaysOf(year, month);
  const dataRows = rows.slice(rowIdx + 1);
  const columnHasMarks = (col: number) => dataRows.some((r) => toText((r ?? [])[nameCol]) && isPresent((r ?? [])[col]));

  // Map each column to a Sunday. Columns that are already a Sunday keep it.
  // A number that isn't a Sunday (typo like "19" for "9") snaps to the one
  // Sunday nobody else claimed, if there is one; otherwise it's skipped
  // (e.g. Dec 25 Christmas service, which the Sunday tracker can't show).
  const claimed = new Set(cols.map((c) => c.day).filter((d): d is number => d !== null && monthSundays.includes(d)));
  const unclaimed = monthSundays.filter((d) => !claimed.has(d));
  const colToDay = new Map<number, number>();
  for (const c of cols) {
    if (c.day !== null && monthSundays.includes(c.day)) {
      colToDay.set(c.col, c.day);
    } else if (c.day !== null) {
      if (unclaimed.length > 0) {
        const snap = unclaimed.shift()!;
        colToDay.set(c.col, snap);
        warnings.push(`Column "${toText(c.raw)}" isn't a Sunday in ${label} — treated as ${MONTH_LABELS[month]} ${snap}.`);
      } else if (columnHasMarks(c.col)) {
        warnings.push(`Column "${toText(c.raw)}" isn't a Sunday in ${label} — skipped.`);
      }
    } else if (columnHasMarks(c.col)) {
      const shown = toText(c.raw) || "(blank)";
      warnings.push(`Column "${shown}" has check marks but no Sunday date — skipped.`);
    }
  }
  if (colToDay.size === 0) return { sheetName, reason: "No usable Sunday columns" };

  const sundays = Array.from(new Set(colToDay.values())).sort((a, b) => a - b);
  const parsedRows: AttendanceSheetRow[] = [];
  let presentCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] ?? [];
    const rawName = toText(row[nameCol]).replace(/\s+/g, " ");
    if (!rawName || looksLikeLabel(rawName)) continue;

    const days: Record<number, boolean> = {};
    sundays.forEach((d) => (days[d] = false));
    colToDay.forEach((day, col) => {
      if (isPresent(row[col])) days[day] = true;
    });
    presentCount += Object.values(days).filter(Boolean).length;
    parsedRows.push({ rowNumber: rowIdx + 2 + i, rawName, days });
  }

  if (parsedRows.length === 0) return { sheetName, reason: "No names under the NAME column" };

  return {
    sheetName,
    year,
    month,
    monthKey: `${year}-${month}`,
    label,
    sundays,
    rows: parsedRows,
    presentCount,
    warnings,
  };
}

/**
 * Parses every sheet of the workbook. `sheets` maps sheet name -> rows as
 * returned by XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }).
 *
 * - Sheets with no check marks at all (blank templates) are skipped.
 * - If two sheets land on the same month, the one with more check marks wins.
 */
export function parseAttendanceWorkbook(sheets: { name: string; rows: unknown[][] }[]): AttendanceWorkbookParseResult {
  const parsed: ParsedAttendanceSheet[] = [];
  const skippedSheets: SkippedSheet[] = [];

  for (const { name, rows } of sheets) {
    const upper = name.toUpperCase();
    if (EXCLUDED_SHEET_KEYWORDS.some((k) => upper.includes(k))) {
      skippedSheets.push({ sheetName: name, reason: "Not a Sunday Worship Service sheet" });
      continue;
    }
    const result = parseSheet(name, rows);
    if ("reason" in result) {
      skippedSheets.push(result);
    } else if (result.presentCount === 0) {
      skippedSheets.push({ sheetName: name, reason: `No check marks (blank template for ${result.label}?)` });
    } else {
      parsed.push(result);
    }
  }

  // One sheet per month — keep the fuller one.
  const byMonth = new Map<string, ParsedAttendanceSheet>();
  for (const s of parsed) {
    const existing = byMonth.get(s.monthKey);
    if (!existing) {
      byMonth.set(s.monthKey, s);
    } else {
      const [keep, drop] = s.presentCount > existing.presentCount ? [s, existing] : [existing, s];
      byMonth.set(s.monthKey, keep);
      skippedSheets.push({
        sheetName: drop.sheetName,
        reason: `Same month as "${keep.sheetName}" (${keep.label}), which has more check marks`,
      });
    }
  }

  const finalSheets = Array.from(byMonth.values()).sort((a, b) => a.year - b.year || a.month - b.month);
  return { sheets: finalSheets, skippedSheets };
}

// ─────────────────────────────────────────────────────────────────────────────
// Name normalization + matching
// ─────────────────────────────────────────────────────────────────────────────

/** Honorifics/church titles stripped from the front of a name before matching. */
const TITLES = new Set([
  "ds", "rev", "pred", "deac", "deacon", "deaconess", "kptd", "ptr", "pastor", "bro", "sis",
  "dr", "atty", "engr", "mr", "mrs", "ms", "elder", "evang", "ps",
]);
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv"]);

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // ñ -> n, é -> e
    .toLowerCase()
    .replace(/[.]/g, " ")
    .replace(/[^a-z0-9,\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface NormalizedName {
  first: string; // folded, e.g. "ernesto"
  last: string; // folded, e.g. "macatumpag"
  suffix: string; // "jr" | "sr" | ""
  key: string; // `${first} ${last}` — used for exact matching
  /** Display-cased parts (titles/suffix removed) — used when creating a visitor. */
  displayFirst: string;
  displayLast: string;
  displaySuffix: string;
  displayMiddle: string; // middle initial if one was written, e.g. "D"
}

function splitWords(s: string): string[] {
  return s.replace(/\./g, ". ").split(/\s+/).map((w) => w.trim()).filter(Boolean);
}
function foldWord(w: string): string {
  return fold(w).replace(/,/g, "");
}

/** "Abello, Del" / "Pred. Ronaldo Macatumpag" / "Macatumpag, Ernesto Jr." / "Danjoe Canaria Jr." */
export function normalizeImportedName(raw: string): NormalizedName {
  let lastPart: string[] = [];
  let firstPart: string[] = [];

  const commaIdx = raw.indexOf(",");
  if (commaIdx >= 0) {
    lastPart = splitWords(raw.slice(0, commaIdx));
    firstPart = splitWords(raw.slice(commaIdx + 1));
  } else {
    const words = splitWords(raw);
    while (words.length > 2 && TITLES.has(foldWord(words[0]))) words.shift();
    // trailing suffix stays attached to first part for the suffix scan below
    let suffixWord: string | null = null;
    if (words.length > 2 && SUFFIXES.has(foldWord(words[words.length - 1]))) suffixWord = words.pop()!;
    lastPart = words.length > 1 ? [words[words.length - 1]] : [];
    firstPart = words.length > 1 ? words.slice(0, -1) : words;
    if (suffixWord) firstPart.push(suffixWord);
  }

  // Strip leading titles from the first part ("Pred.", "Ds. Rev.").
  while (firstPart.length > 1 && TITLES.has(foldWord(firstPart[0]))) firstPart.shift();

  // Pull out a suffix from either side ("Ernesto Jr." or "Paredes Jr.").
  let displaySuffix = "";
  const takeSuffix = (arr: string[]) => {
    if (arr.length > 1 && SUFFIXES.has(foldWord(arr[arr.length - 1]))) displaySuffix = arr.pop()!;
  };
  takeSuffix(firstPart);
  takeSuffix(lastPart);

  // A trailing single letter is a middle initial ("Soriano, Antonio D.") — the
  // directory keeps that in middleInitial, so leave it out of the match key.
  let displayMiddle = "";
  if (firstPart.length > 1 && /^[A-Za-z]\.?$/.test(firstPart[firstPart.length - 1])) {
    displayMiddle = firstPart.pop()!.replace(".", "").toUpperCase();
  }

  const tidy = (arr: string[]) => arr.join(" ").replace(/\s+\./g, ".").replace(/\s+/g, " ").trim();
  const displayFirst = tidy(firstPart);
  const displayLast = tidy(lastPart);
  const first = fold(displayFirst).replace(/,/g, "");
  const last = fold(displayLast).replace(/,/g, "");
  const suffix = displaySuffix ? foldWord(displaySuffix) : "";

  return {
    first,
    last,
    suffix,
    key: `${first} ${last}`.trim(),
    displayFirst,
    displayLast,
    displaySuffix,
    displayMiddle,
  };
}

/** Same normalization applied to a Member record, so both sides compare equally. */
export function normalizeMemberName(m: Pick<Member, "firstName" | "lastName">): NormalizedName {
  return normalizeImportedName(`${m.lastName ?? ""}, ${m.firstName ?? ""}`);
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Close-enough spelling ("Atonito"/"Antonito", "Cecil"/"Cecille") without
 *  pairing up different people like "Ricky"/"Lucky" Velasco. */
export function isLikelySamePerson(a: NormalizedName, b: NormalizedName): boolean {
  if (!a.first || !a.last || !b.first || !b.last) return false;
  if (a.first[0] !== b.first[0] || a.last[0] !== b.last[0]) return false;
  if (a.suffix && b.suffix && a.suffix !== b.suffix) return false;
  const dFirst = levenshtein(a.first, b.first);
  const dLast = levenshtein(a.last, b.last);
  const total = dFirst + dLast;
  if (total === 0) return true;
  // One typo anywhere: "Atonito"/"Antonito", "Jerico"/"Jericho".
  if (total === 1) return Math.min(a.first.length, b.first.length) >= 3;
  if (dLast !== 0) return false;
  // Same last name, first name only shortened: "Cecil"/"Cecille", "Marvy"/"Marvy Kaye".
  const [short, long] = a.first.length <= b.first.length ? [a.first, b.first] : [b.first, a.first];
  return short.length >= 4 && long.startsWith(short) && (long.length - short.length <= 2 || long[short.length] === " ");
}

export type MatchKind = "exact" | "suggested" | "ambiguous" | "none";

export interface MemberMatch {
  kind: MatchKind;
  member: Member | null;
  /** For "ambiguous": the members that share this name. */
  candidates: Member[];
}

/** Precomputes normalized names once, then matches any number of imported names. */
export function createMemberMatcher(members: Member[]) {
  const normalized = members.map((m) => ({ m, n: normalizeMemberName(m) }));
  const byKey = new Map<string, { m: Member; n: NormalizedName }[]>();
  for (const entry of normalized) {
    const list = byKey.get(entry.n.key) ?? [];
    list.push(entry);
    byKey.set(entry.n.key, list);
  }

  return function match(name: NormalizedName): MemberMatch {
    const sameKey = byKey.get(name.key) ?? [];
    if (sameKey.length > 0) {
      // Ernesto Jr. vs Ernesto Sr. — let the suffix decide when there's more than one.
      let pool = sameKey;
      if (pool.length > 1) {
        const bySuffix = pool.filter((e) => e.n.suffix === name.suffix);
        if (bySuffix.length > 0) pool = bySuffix;
      } else if (name.suffix && pool[0].n.suffix && pool[0].n.suffix !== name.suffix) {
        pool = [];
      }
      if (pool.length === 1) return { kind: "exact", member: pool[0].m, candidates: [] };
      if (pool.length > 1) return { kind: "ambiguous", member: null, candidates: pool.map((e) => e.m) };
    }

    const close = normalized.filter((e) => isLikelySamePerson(name, e.n));
    if (close.length === 1) return { kind: "suggested", member: close[0].m, candidates: [] };
    if (close.length > 1) return { kind: "ambiguous", member: null, candidates: close.map((e) => e.m) };
    return { kind: "none", member: null, candidates: [] };
  };
}
