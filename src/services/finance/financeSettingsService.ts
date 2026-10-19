import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { GeneralFundSettings } from "../../types/finance";

const generalFundRef = doc(db, "financeSettings", "generalFund");

const DEFAULT_SETTINGS: GeneralFundSettings = { openingBalance: 0, modifiedBy: "", dateModified: "" };

export async function getGeneralFundSettings(): Promise<GeneralFundSettings> {
  const snap = await getDoc(generalFundRef);
  if (!snap.exists()) return DEFAULT_SETTINGS;
  const data = snap.data() as Partial<GeneralFundSettings>;
  return {
    openingBalance: data.openingBalance ?? 0,
    modifiedBy: data.modifiedBy ?? "",
    dateModified: data.dateModified ?? "",
  };
}

/** Overwrites the whole doc, so a legacy `openingDate` field from older versions is dropped. */
export async function saveGeneralFundSettings(openingBalance: number, currentUser: string): Promise<GeneralFundSettings> {
  const settings: GeneralFundSettings = {
    openingBalance,
    modifiedBy: currentUser,
    dateModified: new Date().toISOString(),
  };
  await setDoc(generalFundRef, settings);
  return settings;
}
