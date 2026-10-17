import { useCallback, useMemo, useState } from "react";
import type { Member } from "../types/member";
import type { ParsedAttendanceSheet, SkippedSheet } from "../utils/attendanceExcelMapper";
import {
  buildImportPeople,
  buildImportPlan,
  defaultResolutions,
  type ExistingAttendance,
  type ImportPerson,
  type Resolution,
  type ResolutionNote,
} from "../utils/attendanceImportPlan";
import {
  applyAttendanceImport,
  getAllMembersForMatching,
  getExistingAttendance,
  parseAttendanceFile,
  type ApplyImportSummary,
} from "../services/attendance/attendanceImportService";

export type AttendanceImportStep = "idle" | "parsing" | "preview" | "importing" | "done" | "error";

/**
 * Drives the "Import Attendance" flow on the Members Attendance page:
 * pick file -> preview (choose months, review name matches) -> confirm.
 * Same step machine as useMemberImport / useAnniversaryImport.
 */
export default function useAttendanceImport(currentUser: string) {
  const [step, setStep] = useState<AttendanceImportStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const [sheets, setSheets] = useState<ParsedAttendanceSheet[]>([]);
  const [skippedSheets, setSkippedSheets] = useState<SkippedSheet[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());

  const [members, setMembers] = useState<Member[]>([]);
  const [existing, setExisting] = useState<ExistingAttendance>({});

  /** Only the user's manual changes — everything else falls back to the computed default. */
  const [overrides, setOverrides] = useState<Record<string, Resolution>>({});
  const [keepExistingChecks, setKeepExistingChecks] = useState(false);

  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [summary, setSummary] = useState<ApplyImportSummary | null>(null);

  const selectFile = useCallback(async (file: File) => {
    setStep("parsing");
    setError(null);
    setFileName(file.name);
    try {
      const parsed = await parseAttendanceFile(file);
      if (parsed.sheets.length === 0) {
        setError(
          "No Worship Service attendance sheets found. Each sheet needs a NAME column with Sunday dates beside it and at least one check mark."
        );
        setSkippedSheets(parsed.skippedSheets);
        setStep("error");
        return;
      }
      const [allMembers, existingAttendance] = await Promise.all([
        getAllMembersForMatching(),
        getExistingAttendance(parsed.sheets.map((s) => s.monthKey)),
      ]);
      setSheets(parsed.sheets);
      setSkippedSheets(parsed.skippedSheets);
      setSelectedMonths(new Set(parsed.sheets.map((s) => s.monthKey)));
      setMembers(allMembers);
      setExisting(existingAttendance);
      setOverrides({});
      setStep("preview");
    } catch (err: any) {
      console.error("Failed to read attendance file:", err);
      setError(err?.message || "Failed to read the file.");
      setStep("error");
    }
  }, []);

  const activeSheets = useMemo(() => sheets.filter((s) => selectedMonths.has(s.monthKey)), [sheets, selectedMonths]);

  const people: ImportPerson[] = useMemo(() => buildImportPeople(activeSheets, members), [activeSheets, members]);

  const defaults = useMemo(() => defaultResolutions(people), [people]);

  const resolutions = useMemo(() => {
    const out: Record<string, Resolution> = {};
    for (const p of people) out[p.key] = overrides[p.key] ?? defaults[p.key].resolution;
    return out;
  }, [people, defaults, overrides]);

  const notes = useMemo(() => {
    const out: Record<string, ResolutionNote> = {};
    for (const p of people) out[p.key] = defaults[p.key].note;
    return out;
  }, [people, defaults]);

  const plan = useMemo(
    () => buildImportPlan(people, resolutions, activeSheets, existing, { keepExistingChecks }),
    [people, resolutions, activeSheets, existing, keepExistingChecks]
  );

  function toggleMonth(monthKey: string) {
    setSelectedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(monthKey)) next.delete(monthKey);
      else next.add(monthKey);
      return next;
    });
  }

  function setResolution(personKey: string, resolution: Resolution) {
    setOverrides((prev) => ({ ...prev, [personKey]: resolution }));
  }

  const confirmImport = useCallback(async () => {
    setStep("importing");
    setError(null);
    setProgress({ done: 0, total: 1 });
    try {
      const result = await applyAttendanceImport(plan, people, currentUser, (done, total) =>
        setProgress({ done, total })
      );
      setSummary(result);
      setStep("done");
    } catch (err: any) {
      console.error("Attendance import failed:", err);
      setError(err?.message || "Import failed partway through. Some attendance may already have been saved.");
      setStep("error");
    }
  }, [plan, people, currentUser]);

  const reset = useCallback(() => {
    setStep("idle");
    setError(null);
    setFileName("");
    setSheets([]);
    setSkippedSheets([]);
    setSelectedMonths(new Set());
    setMembers([]);
    setExisting({});
    setOverrides({});
    setKeepExistingChecks(false);
    setProgress(null);
    setSummary(null);
  }, []);

  return {
    step,
    error,
    fileName,
    sheets,
    skippedSheets,
    selectedMonths,
    toggleMonth,
    members,
    people,
    resolutions,
    notes,
    setResolution,
    keepExistingChecks,
    setKeepExistingChecks,
    plan,
    progress,
    summary,
    selectFile,
    confirmImport,
    reset,
  };
}

export type UseAttendanceImportResult = ReturnType<typeof useAttendanceImport>;
