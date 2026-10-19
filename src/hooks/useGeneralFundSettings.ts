import { useEffect, useState } from "react";
import { getGeneralFundSettings, saveGeneralFundSettings } from "../services/finance/financeSettingsService";
import type { GeneralFundSettings } from "../types/finance";

/** Loads and saves the General Fund starting balance for Settings → General. */
export default function useGeneralFundSettings(currentUser: string) {
  const [settings, setSettings] = useState<GeneralFundSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getGeneralFundSettings()
      .then(setSettings)
      .catch((err) => {
        console.error("Failed to load General Fund settings:", err);
        setError("Failed to load the starting balance.");
      });
  }, []);

  /** Returns true when saved, so the caller can leave edit mode. */
  async function saveStartingBalance(amount: number): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      setSettings(await saveGeneralFundSettings(amount, currentUser));
      return true;
    } catch (err) {
      console.error("Failed to save starting balance:", err);
      setError("Failed to save the starting balance.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    loading: settings === null && !error,
    startingBalance: settings?.openingBalance ?? 0,
    isSet: Boolean(settings?.dateModified),
    modifiedBy: settings?.modifiedBy ?? "",
    dateModified: settings?.dateModified ?? "",
    saving,
    error,
    saveStartingBalance,
  };
}
