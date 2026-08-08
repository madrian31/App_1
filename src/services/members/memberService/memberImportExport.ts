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

/**
 * Writes parsed rows to Firestore in batches of 450 (Firestore's hard limit is 500 writes/batch).
 * Uses a deterministic doc ID per member (see buildMemberId) with `merge: true`, so importing
 * the same file — or a file with overlapping rows — twice updates existing members in place
 * instead of creating duplicate entries.
 * Reports progress via onProgress(written, total) after each batch commits.
 */
export async function bulkImportMembers(
  members: ImportedMember[],
  addedBy: string,
  onProgress?: (written: number, total: number) => void
): Promise<{ written: number }> {
  const BATCH_SIZE = 450;
  const dateAdded = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  let written = 0;

  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const chunk = members.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (const m of chunk) {
      const ref = doc(membersCol, buildMemberId(m));
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

  return { written };
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