import { useState, useCallback } from "react";
import { parseCalendarFile, type CalendarParseResult } from "../utils/calendarExcelMapper";
import * as calendarEventsService from "../services/calendar/calendarEventsService";
import * as calendarCategoriesService from "../services/calendar/calendarCategoriesService";
import { CALENDAR_IMPORT_LEGEND_COLORS, type CalendarCategoryItem } from "../types/calendarEvent";

export type CalendarImportStep = "idle" | "parsing" | "preview" | "importing" | "done" | "error";

export interface CalendarImportSummary {
  written: number;
  categoriesCreated: number;
}

export interface UseCalendarImportResult {
  step: CalendarImportStep;
  parseResult: CalendarParseResult | null;
  error: string | null;
  summary: CalendarImportSummary | null;
  /** CATEGORY labels found in the file that don't match any existing category — these get created automatically on confirm. */
  newCategoryLabels: string[];
  selectFile: (file: File, existingCategories: CalendarCategoryItem[]) => Promise<void>;
  confirmImport: () => Promise<void>;
  reset: () => void;
}

function fallbackColorFor(label: string): string {
  return CALENDAR_IMPORT_LEGEND_COLORS[label.trim().toUpperCase()] || "#5a6b7a";
}

export default function useCalendarImport(): UseCalendarImportResult {
  const [step, setStep] = useState<CalendarImportStep>("idle");
  const [parseResult, setParseResult] = useState<CalendarParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CalendarImportSummary | null>(null);
  const [newCategoryLabels, setNewCategoryLabels] = useState<string[]>([]);
  const [existingCats, setExistingCats] = useState<CalendarCategoryItem[]>([]);

  const selectFile = useCallback(async (file: File, existingCategories: CalendarCategoryItem[]) => {
    setStep("parsing");
    setError(null);
    setExistingCats(existingCategories);
    try {
      const result = await parseCalendarFile(file);
      if (result.rows.length === 0) {
        setError(
          'No valid rows found. Make sure the DATE and ACTIVITY columns are filled in, and that a month section header (e.g. "JUNE 2026") appears above rows that only list a day number.'
        );
        setStep("error");
        return;
      }
      const existingLabels = new Set(existingCategories.map((c) => c.label.trim().toUpperCase()));
      setNewCategoryLabels(result.categoryLabels.filter((l) => !existingLabels.has(l.trim().toUpperCase())));
      setParseResult(result);
      setStep("preview");
    } catch (err: any) {
      setError(err?.message || "Failed to read the file.");
      setStep("error");
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!parseResult) return;
    setStep("importing");
    try {
      // Create any missing categories first so every row has a real cat id.
      const labelToId = new Map<string, string>();
      existingCats.forEach((c) => labelToId.set(c.label.trim().toUpperCase(), c.id));

      let categoriesCreated = 0;
      for (const label of newCategoryLabels) {
        const id = await calendarCategoriesService.addCategory(label, "fa-solid fa-calendar-check", fallbackColorFor(label));
        labelToId.set(label.trim().toUpperCase(), id);
        categoriesCreated++;
      }

      const payload = parseResult.rows.map((r) => {
        const { categoryLabel, ...rest } = r.data;
        return { ...rest, cat: labelToId.get(categoryLabel.trim().toUpperCase()) || "" };
      });

      const written = await calendarEventsService.bulkAddEvents(payload);
      setSummary({ written: written.length, categoriesCreated });
      setStep("done");
    } catch (err: any) {
      setError(err?.message || "Import failed partway through. Some activities may have already been added.");
      setStep("error");
    }
  }, [parseResult, newCategoryLabels, existingCats]);

  const reset = useCallback(() => {
    setStep("idle");
    setParseResult(null);
    setError(null);
    setSummary(null);
    setNewCategoryLabels([]);
    setExistingCats([]);
  }, []);

  return { step, parseResult, error, summary, newCategoryLabels, selectFile, confirmImport, reset };
}
