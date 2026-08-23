import * as XLSX from "xlsx";
import { parseAnniversarySheet, type AnniversaryParseResult } from "../../../utils/anniversaryExcelMapper";

export async function parseAnniversariesFile(
  file: File,
  sheetName = "BIRTHDAYS & ANNIVERSARIES"
): Promise<AnniversaryParseResult | null> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { cellDates: true });

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  return parseAnniversarySheet(rows);
}