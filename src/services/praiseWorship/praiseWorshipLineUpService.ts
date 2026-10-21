import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { normalizeSongs } from "../../types/praiseWorship";
import type { NewPraiseWorshipLineUpEntry, PraiseWorshipLineUpEntry } from "../../types/praiseWorship";

const COLLECTION = "praiseWorshipLineUp";

export async function getPraiseWorshipLineUp(date: string): Promise<PraiseWorshipLineUpEntry | null> {
  const snap = await getDoc(doc(db, COLLECTION, date));
  if (!snap.exists()) return null;
  const data = snap.data() as PraiseWorshipLineUpEntry;
  return { ...data, songs: normalizeSongs(data.songs) };
}

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Creates or replaces the line-up for one date. A full replace (no merge),
 *  so a position that was cleared doesn't keep its old person — only
 *  dateAdded is carried over from the existing doc. */
export async function savePraiseWorshipLineUp(entry: NewPraiseWorshipLineUpEntry): Promise<void> {
  const ref = doc(db, COLLECTION, entry.date);
  const existing = await getDoc(ref);
  const nowISO = new Date().toISOString();
  const payload: PraiseWorshipLineUpEntry = {
    ...entry,
    dateAdded: existing.exists() ? (existing.data().dateAdded as string) ?? nowISO : nowISO,
    dateModified: nowISO,
  };
  // Firestore rejects explicit `undefined` values (e.g. no practice time set).
  await setDoc(ref, stripUndefined(payload));
}
