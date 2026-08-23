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

function nameKey(lastName: string, firstName: string): string {
  return `${lastName.trim().toLowerCase()}|${firstName.trim().toLowerCase()}`;
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

export interface BulkImportSummary {
  written: number;
  inserted: number;
  updated: number;
  unchanged: number;
  ambiguous: number;
  ambiguousNames: string[];
}
export async function bulkImportMembers(
  members: ImportedMember[],
  addedBy: string,
  onProgress?: (written: number, total: number) => void
): Promise<BulkImportSummary> {
  const BATCH_SIZE = 450;
  const dateAdded = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const existingSnap = await getDocs(membersCol);
  const byName = new Map<string, { id: string; data: Record<string, unknown> }[]>();
  existingSnap.docs.forEach((d) => {
    const data = d.data();
    const key = nameKey(String(data.lastName ?? ""), String(data.firstName ?? ""));
    const list = byName.get(key) ?? [];
    list.push({ id: d.id, data });
    byName.set(key, list);
  });

  const newlyAssigned = new Map<string, { id: string; data: Record<string, unknown> }>();

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  let ambiguous = 0;
  const ambiguousNames: string[] = [];
  let totalWritten = 0;

  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const chunk = members.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    let chunkWritten = 0;

    for (const m of chunk) {
      const key = nameKey(m.lastName, m.firstName);
      const pendingNew = newlyAssigned.get(key);
      const existingCandidates = byName.get(key);

      let targetId: string;
      let existingData: Record<string, unknown> | undefined;

      if (pendingNew) {
        targetId = pendingNew.id;
        existingData = pendingNew.data;
      } else if (existingCandidates && existingCandidates.length === 1) {
        targetId = existingCandidates[0].id;
        existingData = existingCandidates[0].data;
      } else if (existingCandidates && existingCandidates.length > 1) {
        ambiguous++;
        ambiguousNames.push(`${m.firstName} ${m.lastName}`);
        continue;
      } else {
        targetId = doc(membersCol).id; // brand-new member — auto-generated id
        existingData = undefined;
      }

      if (!existingData) {
        inserted++;
      } else if (isSameData(existingData, m)) {
        unchanged++;
      } else {
        updated++;
      }

      newlyAssigned.set(key, { id: targetId, data: m as unknown as Record<string, unknown> });

      const ref = doc(membersCol, targetId);
      batch.set(
        ref,
        {
          ...m,
          // Preserve flags/meta that live outside the imported file, rather
          // than resetting them every re-import.
          isPledger: (existingData?.isPledger as boolean) ?? false,
          isArchived: (existingData?.isArchived as boolean) ?? false,
          addedBy: (existingData?.addedBy as string) ?? addedBy,
          dateAdded: (existingData?.dateAdded as string) ?? dateAdded,
        },
        { merge: true }
      );
      chunkWritten++;
    }

    await batch.commit();
    totalWritten += chunkWritten;
    onProgress?.(totalWritten, members.length);
  }

  return { written: totalWritten, inserted, updated, unchanged, ambiguous, ambiguousNames };
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