import * as XLSX from "xlsx";
import { writeBatch, collection, doc } from "firebase/firestore";
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
 * Writes parsed rows to Firestore in batches of 450 (Firestore's hard limit is 500 writes/batch).
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
      const ref = doc(membersCol);
      batch.set(ref, {
        ...m,
        isPledger: false,
        isArchived: false,
        addedBy,
        dateAdded,
      });
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
