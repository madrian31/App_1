import { useState, useCallback } from "react";
import type { ImportedMember, ParseResult } from "../utils/memberExcelMapper";
import { parseMembersFile, bulkImportMembers } from "../services/members/memberService/memberImportExport";

export type ImportStep = "idle" | "parsing" | "preview" | "importing" | "done" | "error";

export interface UseMemberImportResult {
  step: ImportStep;
  parseResult: ParseResult | null;
  error: string | null;
  progress: { written: number; total: number } | null;
  selectFile: (file: File) => Promise<void>;
  confirmImport: (addedBy: string) => Promise<void>;
  reset: () => void;
}

export default function useMemberImport(): UseMemberImportResult {
  const [step, setStep] = useState<ImportStep>("idle");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ written: number; total: number } | null>(null);

  const selectFile = useCallback(async (file: File) => {
    setStep("parsing");
    setError(null);
    try {
      const result = await parseMembersFile(file);
      if (result.rows.length === 0) {
        setError("No valid rows found in the file. Check that Last Name and First Name are filled in.");
        setStep("error");
        return;
      }
      setParseResult(result);
      setStep("preview");
    } catch (err: any) {
      setError(err?.message || "Failed to read the file.");
      setStep("error");
    }
  }, []);

  const confirmImport = useCallback(
    async (addedBy: string) => {
      if (!parseResult) return;
      setStep("importing");
      setProgress({ written: 0, total: parseResult.rows.length });
      try {
        const data: ImportedMember[] = parseResult.rows.map((r) => r.data);
        await bulkImportMembers(data, addedBy, (written, total) => setProgress({ written, total }));
        setStep("done");
      } catch (err: any) {
        setError(err?.message || "Import failed partway through. Some members may have already been added.");
        setStep("error");
      }
    },
    [parseResult]
  );

  const reset = useCallback(() => {
    setStep("idle");
    setParseResult(null);
    setError(null);
    setProgress(null);
  }, []);

  return { step, parseResult, error, progress, selectFile, confirmImport, reset };
}
