import { useCallback, useState } from "react";
import { parseAnniversariesFile } from "../services/members/memberService/anniversaryImportExport";
import { buildAnniversaryMatches, type AnniversaryMatchRow } from "../utils/anniversaryExcelMapper";
import { getAllMembers, updateMember } from "../services/members/memberService/membersService";
import type { Member } from "../types/member";

export type AnniversaryImportStep = "idle" | "parsing" | "preview" | "importing" | "done" | "error";

export interface AnniversaryImportSummary {
  written: number; // member docs updated (each matched spouse counts separately)
  skippedRows: number; // rows with no match on either side
}

export interface UseAnniversaryImportResult {
  step: AnniversaryImportStep;
  rows: AnniversaryMatchRow[];
  skippedParseRows: { rowNumber: number; reason: string }[];
  error: string | null;
  summary: AnniversaryImportSummary | null;
  /** Returns true if a preview is ready to show, false if there was nothing to import. */
  selectFile: (file: File) => Promise<boolean>;
  updateRowMatch: (rowNumber: number, side: "husband" | "wife", member: Member | null) => void;
  confirmImport: () => Promise<void>;
  reset: () => void;
}

export default function useAnniversaryImport(): UseAnniversaryImportResult {
  const [step, setStep] = useState<AnniversaryImportStep>("idle");
  const [rows, setRows] = useState<AnniversaryMatchRow[]>([]);
  const [skippedParseRows, setSkippedParseRows] = useState<{ rowNumber: number; reason: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AnniversaryImportSummary | null>(null);

  const selectFile = useCallback(async (file: File): Promise<boolean> => {
    setStep("parsing");
    setError(null);
    try {
      const parseResult = await parseAnniversariesFile(file);
      if (!parseResult || parseResult.rows.length === 0) {
        setStep("idle");
        return false; // no sheet, or nothing found — quietly do nothing
      }

      const members = await getAllMembers();
      const matched = buildAnniversaryMatches(parseResult.rows, members.filter((m) => !m.isArchived));
      setRows(matched);
      setSkippedParseRows(parseResult.skipped);
      setStep("preview");
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to read anniversary data from the file.");
      setStep("error");
      return true; // still surface the modal so the user sees the error
    }
  }, []);

  const updateRowMatch = useCallback((rowNumber: number, side: "husband" | "wife", member: Member | null) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowNumber !== rowNumber) return r;
        if (side === "husband") {
          return { ...r, husbandMemberId: member?.id ?? "", husbandName: member ? `${member.firstName} ${member.lastName}` : "" };
        }
        return { ...r, wifeMemberId: member?.id ?? "", wifeName: member ? `${member.firstName} ${member.lastName}` : "" };
      })
    );
  }, []);

  const confirmImport = useCallback(async () => {
    setStep("importing");
    setError(null);
    try {
      let written = 0;
      let skippedRows = 0;

      for (const r of rows) {
        const ids = [r.husbandMemberId, r.wifeMemberId].filter(Boolean);
        if (ids.length === 0) {
          skippedRows++;
          continue;
        }
        for (const id of ids) {
          await updateMember(id, { weddingAnniversary: r.date });
          written++;
        }
      }

      setSummary({ written, skippedRows });
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Import failed partway through. Some members may have already been updated.");
      setStep("error");
    }
  }, [rows]);

  const reset = useCallback(() => {
    setStep("idle");
    setRows([]);
    setSkippedParseRows([]);
    setError(null);
    setSummary(null);
  }, []);

  return { step, rows, skippedParseRows, error, summary, selectFile, updateRowMatch, confirmImport, reset };
}