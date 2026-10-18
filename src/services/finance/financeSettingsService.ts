import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { GeneralFundSettings } from "../../types/finance";

const generalFundRef = doc(db, "financeSettings", "generalFund");

const DEFAULT_SETTINGS: GeneralFundSettings = { openingBalance: 0, openingDate: "", modifiedBy: "", dateModified: "" };

export async function getGeneralFundSettings(): Promise<GeneralFundSettings> {
  const snap = await getDoc(generalFundRef);
  if (!snap.exists()) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<GeneralFundSettings>) };
}

export async function saveGeneralFundSettings(
  openingBalance: number,
  openingDate: string,
  currentUser: string
): Promise<GeneralFundSettings> {
  const settings: GeneralFundSettings = {
    openingBalance,
    openingDate,
    modifiedBy: currentUser,
    dateModified: new Date().toISOString(),
  };
  await setDoc(generalFundRef, settings);
  return settings;
}
