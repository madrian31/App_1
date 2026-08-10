import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { LookupListKey } from "../../types/lookupList";

const COLLECTION = "lookupLists";

export async function getLookupList(key: LookupListKey): Promise<string[]> {
  const ref = doc(db, COLLECTION, key);
  const snap = await getDoc(ref);
  if (!snap.exists()) return [];
  const values = snap.data().values;
  return Array.isArray(values) ? values : [];
}

export async function saveLookupList(key: LookupListKey, values: string[]): Promise<void> {
  const ref = doc(db, COLLECTION, key);
  await setDoc(ref, { values }, { merge: true });
}

/** Writes the seed values only if the list doc doesn't exist yet — safe to call every load. */
export async function seedLookupListIfEmpty(key: LookupListKey, seedValues: string[]): Promise<void> {
  const ref = doc(db, COLLECTION, key);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { values: seedValues });
  }
}
