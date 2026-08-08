import * as XLSX from "xlsx";
import { writeBatch, collection, doc, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import type { Member } from "../../../types/member";
import {
  parseMembersSheet,
  EXPORT_COLUMNS,
  type ImportedMember,
  type ParseResult,
} from "../../../utils/memberExcelMapper";

const membersCol = collection(db, "members");

/** Reads a .xlsx File chosen in the browser and returns parsed member rows + a skipped-row report. */
export async function parseMembersFile(file: File, sheetName = "MEMBERS DATA"): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });

  const sheet = workbook.Sheets[sheetName] ?? workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found in the workbook.`);

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return parseMembersSheet(rows);
}

/**
 * Builds a stable, deterministic document ID for a member based on identifying fields.
 * Re-importing the same person (same name + birthday) will always resolve to the same
 * ID, so bulkImportMembers can safely overwrite/merge instead of creating a duplicate.
 *
 * NOTE: two different people who happen to share last name, first name, AND birthday
 * would collide under this scheme (rare, but possible). If that's a real concern, add
 * another distinguishing field (e.g. middleInitial) into the key below.
 */
function buildMemberId(m: ImportedMember): string {
  const key = `${m.lastName}-${m.firstName}-${m.birthday || "no-bday"}`;
  return key
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents (e.g. "José" -> "jose")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Fields that come from the imported file — compared to tell "updated" apart from "already existed, unchanged". */
const COMPARABLE_FIELDS: (keyof ImportedMember)[] = [
  "lastName",
  "firstName",
  "middleInitial",
  "gender",
  "birthday",
  "dateOfBaptism",
  "facebookName",
  "status",
  "category",
  "ministry",
  "isSmallGroupLeader",
  "us2cgLevel",
];

/** True if every importable field on the existing Firestore doc matches the incoming row. */
function isSameData(existing: Record<string, unknown> | undefined, incoming: ImportedMember): boolean {
  if (!existing) return false;
  return COMPARABLE_FIELDS.every((field) => (existing[field] ?? "") === (incoming[field] ?? ""));
}

/**
 * Writes parsed rows to Firestore in batches of 450 (Firestore's hard limit is 500 writes/batch).
 * Uses a deterministic doc ID per member (see buildMemberId) with `merge: true`, so importing
 * the same file — or a file with overlapping rows — twice updates existing members in place
 * instead of creating duplicate entries.
 *
 * Before writing, fetches all existing member docs once so it can classify every row as:
 *  - inserted: no existing doc with this ID (brand-new member)
 *  - updated: existing doc found, but at least one field differs from the incoming row
 *  - unchanged: existing doc found and every field already matches (already existed, no-op)
 *
 * Reports progress via onProgress(written, total) after each batch commits.
 */
export async function bulkImportMembers(
  members: ImportedMember[],
  addedBy: string,
  onProgress?: (written: number, total: number) => void
): Promise<{ written: number; inserted: number; updated: number; unchanged: number }> {
  const BATCH_SIZE = 450;
  const dateAdded = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // One read of all existing members, done up front, so we can classify every row
  // (new / updated / unchanged) without a separate read per member.
  const existingSnap = await getDocs(membersCol);
  const existingById = new Map(existingSnap.docs.map((d) => [d.id, d.data()]));

  let written = 0;
  let inserted = 0;
  let updated = 0;
  let unchanged = 0;

  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const chunk = members.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const m of chunk) {
      const id = buildMemberId(m);
      const existingData = existingById.get(id);

      if (!existingData) {
        inserted++;
      } else if (isSameData(existingData, m)) {
        unchanged++;
      } else {
        updated++;
      }
      // Track this row's data so duplicate rows within the same file are classified
      // against each other too, not just against what was already in Firestore.
      existingById.set(id, m as unknown as Record<string, unknown>);

      const ref = doc(membersCol, id);
      batch.set(
        ref,
        {
          ...m,
          isPledger: false,
          isArchived: false,
          addedBy,
          dateAdded,
        },
        { merge: true } // update existing member instead of overwriting isPledger/isArchived flags they may have set manually
      );
    }

    await batch.commit();
    written += chunk.length;
    onProgress?.(written, members.length);
  }

  return { written, inserted, updated, unchanged };
}

/** Builds and downloads an .xlsx export of the given members, matching the directory's original column layout. */
export function exportMembersToFile(members: Member[], filename = "members-export.xlsx") {
  const headerRow = EXPORT_COLUMNS.map((c) => c.header);
  const dataRows = members.map((m) => EXPORT_COLUMNS.map((c) => c.get(m)));

  const sheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  sheet["!cols"] = EXPORT_COLUMNS.map(() => ({ wch: 20 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "MEMBERS DATA");

  XLSX.writeFile(workbook, filename);
}