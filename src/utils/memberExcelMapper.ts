import type { Member } from "../types/member";

export type ImportedMember = Omit<Member, "id" | "addedBy" | "dateAdded" | "isArchived" | "isPledger">;

export interface ParsedRow {
  rowNumber: number; // 1-based spreadsheet row, for error reporting
  data: ImportedMember;
}

export interface ParseResult {
  rows: ParsedRow[];
  skipped: { rowNumber: number; reason: string }[];
}

type FieldKey = keyof ImportedMember | "age"; // "age" is recognized but always ignored — Age is computed, never imported

const HEADER_ALIASES: Record<string, FieldKey> = {
  "LAST NAME": "lastName",
  "FIRST NAME": "firstName",
  "M.I.": "middleInitial",
  GENDER: "gender",
  BIRTHDAY: "birthday",
  AGE: "age",
  "DATE OF BAPTISM": "dateOfBaptism",
  "FACEBOOK NAME": "facebookName",
  STATUS: "status",
  CATEGORY: "category",
  MINISTRY: "ministry",
  "SMALL GROUP": "isSmallGroupLeader",
  "US2CG LEVEL": "us2cgLevel",
};

function normalizeHeader(raw: string): string {
  // Strips trailing hints like "MM/DD/YYYY" so "BIRTHDAY MM/DD/YYYY" still matches "BIRTHDAY"
  return raw.trim().toUpperCase().replace(/\s+MM\/DD\/YYYY.*/, "").replace(/\s+/g, " ");
}

function toIsoDate(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const parsed = new Date(String(value));
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

/**
 * Finds the real header row within the first few rows of a sheet. Directories exported
 * from tools like this one often have a title/merged row above the actual column labels
 * (e.g. a merged "NAME" cell spanning Last Name / First Name / M.I.) — so we scan for the
 * row that actually contains "LAST NAME" and "FIRST NAME" rather than assuming row 0.
 */
function findHeaderRowIndex(rows: unknown[][], maxScanRows = 5): number {
  for (let i = 0; i < Math.min(maxScanRows, rows.length); i++) {
    const cells = rows[i].map((c) => normalizeHeader(toText(c)));
    if (cells.includes("LAST NAME") && cells.includes("FIRST NAME")) return i;
  }
  return -1;
}

/**
 * Builds the effective header labels for the detected header row, filling in any blank
 * cells from the row directly above it.
 *
 * Some directories use a two-row header where a parent label (e.g. "GENDER", "BIRTHDAY")
 * is merged vertically across the title row and the sub-header row. In the underlying
 * sheet data, a vertically-merged cell only carries a value in its first (topmost) row —
 * every row below it reads as blank. Since we detect the header row by finding where
 * "LAST NAME"/"FIRST NAME" literally appear (which is the *lower* row in that layout),
 * columns like GENDER/BIRTHDAY/etc. would otherwise look blank on that row even though
 * their label exists one row up. This backfills those blanks from the row above so every
 * column's label is recovered regardless of which row it visually sits on.
 */
function mergeHeaderRows(rows: unknown[][], headerIdx: number): string[] {
  const current = rows[headerIdx].map((c) => normalizeHeader(toText(c)));
  if (headerIdx === 0) return current;

  const above = rows[headerIdx - 1].map((c) => normalizeHeader(toText(c)));
  return current.map((h, idx) => h || above[idx] || "");
}

export function parseMembersSheet(rows: unknown[][]): ParseResult {
  const headerIdx = findHeaderRowIndex(rows);
  if (headerIdx === -1) {
    throw new Error('Could not find a header row with "Last Name" and "First Name" columns in the first 5 rows.');
  }

  const headers = mergeHeaderRows(rows, headerIdx);
  const colIndex: Partial<Record<FieldKey, number>> = {};
  headers.forEach((h, idx) => {
    const key = HEADER_ALIASES[h];
    if (key) colIndex[key] = idx;
  });

  if (colIndex.lastName === undefined || colIndex.firstName === undefined) {
    throw new Error('Missing required "Last Name" or "First Name" column.');
  }

  const parsedRows: ParsedRow[] = [];
  const skipped: { rowNumber: number; reason: string }[] = [];

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const rowNumber = i + 1; // matches the row number you'd see in Excel
    if (row.every((c) => toText(c) === "")) continue; // blank row, skip silently

    const lastName = toText(row[colIndex.lastName]);
    const firstName = toText(row[colIndex.firstName]);

    if (!lastName || !firstName) {
      skipped.push({ rowNumber, reason: "Missing Last Name or First Name" });
      continue;
    }

    const get = (key: FieldKey) => (colIndex[key] !== undefined ? row[colIndex[key] as number] : undefined);

    parsedRows.push({
      rowNumber,
      data: {
        lastName,
        firstName,
        middleInitial: toText(get("middleInitial")),
        gender: toText(get("gender")),
        birthday: toIsoDate(get("birthday")),
        dateOfBaptism: toIsoDate(get("dateOfBaptism")),
        facebookName: toText(get("facebookName")),
        status: toText(get("status")),
        category: toText(get("category")),
        ministry: toText(get("ministry")),
        isSmallGroupLeader: toText(get("isSmallGroupLeader")).toLowerCase() === "leader",
        us2cgLevel: toText(get("us2cgLevel")),
      },
    });
  }

  return { rows: parsedRows, skipped };
}

function computeAgeForExport(birthday?: string): number | "" {
  if (!birthday) return "";
  const dob = new Date(birthday);
  if (isNaN(dob.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? age : "";
}

/** Column order + headers used when building exports — mirrors the original directory layout. */
export const EXPORT_COLUMNS: { header: string; get: (m: Member) => unknown }[] = [
  { header: "LAST NAME", get: (m) => m.lastName },
  { header: "FIRST NAME", get: (m) => m.firstName },
  { header: "M.I.", get: (m) => m.middleInitial },
  { header: "GENDER", get: (m) => m.gender },
  { header: "BIRTHDAY MM/DD/YYYY", get: (m) => m.birthday },
  { header: "AGE", get: (m) => computeAgeForExport(m.birthday) },
  { header: "DATE OF BAPTISM MM/DD/YYYY", get: (m) => m.dateOfBaptism },
  { header: "FACEBOOK NAME", get: (m) => m.facebookName },
  { header: "STATUS", get: (m) => m.status },
  { header: "CATEGORY", get: (m) => m.category },
  { header: "MINISTRY", get: (m) => m.ministry },
  { header: "SMALL GROUP", get: (m) => (m.isSmallGroupLeader ? "Leader" : "") },
  { header: "US2CG LEVEL", get: (m) => m.us2cgLevel },
];