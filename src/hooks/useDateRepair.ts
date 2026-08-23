import { useCallback, useState } from "react";
import { buildDateRepairPlan, applyDateRepairs, type RepairRow } from "../services/members/memberService/dateRepair";

export type DateRepairStep = "idle" | "scanning" | "preview" | "applying" | "done" | "error";

export interface UseDateRepairResult {
  step: DateRepairStep;
  rows: RepairRow[];
  ambiguous: string[];
  unmatched: string[];
  error: string | null;
  updatedCount: number | null;
  scanFile: (file: File) => Promise<void>;
  confirmApply: () => Promise<void>;
  reset: () => void;
}

export default function useDateRepair(): UseDateRepairResult {
  const [step, setStep] = useState<DateRepairStep>("idle");
  const [rows, setRows] = useState<RepairRow[]>([]);
  const [ambiguous, setAmbiguous] = useState<string[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [updatedCount, setUpdatedCount] = useState<number | null>(null);

  const scanFile = useCallback(async (file: File) => {
    setStep("scanning");
    setError(null);
    try {
      const result = await buildDateRepairPlan(file);
      setRows(result.rows);
      setAmbiguous(result.ambiguous);
      setUnmatched(result.unmatched);
      setStep("preview");
    } catch (err: any) {
      setError(err?.message || "Failed to scan the file.");
      setStep("error");
    }
  }, []);

  const confirmApply = useCallback(async () => {
    setStep("applying");
    try {
      const count = await applyDateRepairs(rows);
      setUpdatedCount(count);
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Repair failed partway through. Some members may have already been updated.");
      setStep("error");
    }
  }, [rows]);

  const reset = useCallback(() => {
    setStep("idle");
    setRows([]);
    setAmbiguous([]);
    setUnmatched([]);
    setError(null);
    setUpdatedCount(null);
  }, []);

  return { step, rows, ambiguous, unmatched, error, updatedCount, scanFile, confirmApply, reset };
}