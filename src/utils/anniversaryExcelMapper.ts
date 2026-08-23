import type { Member } from "../types/member";

export interface ParsedAnniversaryRow {
  rowNumber: number;
  raw: string; // e.g. "Michael & Marlyn Malate"
  date: string; // ISO
  guessedHusbandFirstName: string;
  guessedWifeFirstName: string;
  guessedLastName: string;
}

export interface AnniversaryParseResult {
  rows: ParsedAnniversaryRow[];
  skipped: { rowNumber: number; reason: string }[];
}

export interface AnniversaryMatchRow extends ParsedAnniversaryRow {
  husbandMemberId: string; // "" = unmatched
  husbandName: string;
  wifeMemberId: string;
  wifeName: string;
}

const MONTH_NAMES = new Set([
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
]);

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toIsoDate(value: unknown): string {
  if (!value) return "";

  const d = value instanceof Date ? value : new Date(String(value));
  if (isNaN(d.getTime())) return "";

  // IMPORTANT: use LOCAL calendar date components, not .toISOString().
  // SheetJS parses Excel date cells as local midnight; .toISOString()
  // converts that to UTC and silently shifts the date back by one day
  // for any timezone ahead of UTC (e.g. Philippines, UTC+8).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function splitCoupleName(raw: string): { husbandFirstName: string; wifeFirstName: string; lastName: string } {
  const [left, right] = raw.split("&").map((s) => s.trim());
  if (!left || !right) return { husbandFirstName: raw.trim(), wifeFirstName: "", lastName: "" };

  const rightWords = right.split(/\s+/).filter(Boolean);
  if (rightWords.length < 2) {
    return { husbandFirstName: left, wifeFirstName: right, lastName: "" };
  }
  const lastName = rightWords[rightWords.length - 1];
  const wifeFirstName = rightWords.slice(0, -1).join(" ");
  return { husbandFirstName: left, wifeFirstName, lastName };
}

export function parseAnniversarySheet(rows: unknown[][]): AnniversaryParseResult {
  const parsedRows: ParsedAnniversaryRow[] = [];
  const skipped: { rowNumber: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const rowNumber = i + 1;
    const colA = toText(row[0]);
    if (!colA) continue; // blank row

    const upperA = colA.toUpperCase();
    if (MONTH_NAMES.has(upperA)) continue; // section header
    if (upperA === "LAST NAME" || upperA === "NAME") continue; // header row

    const hasAnniversaryLabel = row.some((c) => toText(c).toLowerCase() === "wedding anniversary");
    if (!hasAnniversaryLabel) continue; // a plain birthday row — not our concern here

    if (!colA.includes("&")) {
      skipped.push({ rowNumber, reason: `Could not parse couple name "${colA}" (expected "Name & Name Surname")` });
      continue;
    }

    const dateCell = row.find((c) => c instanceof Date) ?? row[4];
    const date = toIsoDate(dateCell);
    if (!date) {
      skipped.push({ rowNumber, reason: "Missing or unparseable anniversary date" });
      continue;
    }

    const { husbandFirstName, wifeFirstName, lastName } = splitCoupleName(colA);
    if (!husbandFirstName || !wifeFirstName) {
      skipped.push({ rowNumber, reason: `Could not split "${colA}" into husband & wife names` });
      continue;
    }

    parsedRows.push({
      rowNumber,
      raw: colA,
      date,
      guessedHusbandFirstName: husbandFirstName,
      guessedWifeFirstName: wifeFirstName,
      guessedLastName: lastName,
    });
  }

  return { rows: parsedRows, skipped };
}

function findBestMatch(members: Member[], firstName: string, lastName: string): Member | null {
  const fn = firstName.trim().toLowerCase();
  const ln = lastName.trim().toLowerCase();
  if (!fn) return null;

  const exact = members.find(
    (m) => m.firstName.trim().toLowerCase() === fn && m.lastName.trim().toLowerCase() === ln
  );
  if (exact) return exact;

  return members.find((m) => m.firstName.trim().toLowerCase() === fn) ?? null;
}

export function buildAnniversaryMatches(parsed: ParsedAnniversaryRow[], members: Member[]): AnniversaryMatchRow[] {
  return parsed.map((r) => {
    const husband = findBestMatch(members, r.guessedHusbandFirstName, r.guessedLastName);
    const wife = findBestMatch(members, r.guessedWifeFirstName, r.guessedLastName);
    return {
      ...r,
      husbandMemberId: husband?.id ?? "",
      husbandName: husband ? `${husband.firstName} ${husband.lastName}` : "",
      wifeMemberId: wife?.id ?? "",
      wifeName: wife ? `${wife.firstName} ${wife.lastName}` : "",
    };
  });
}