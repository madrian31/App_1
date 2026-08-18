import { collection, doc, getDoc, getDocs, query, orderBy, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { NewProgramLineUpEntry, ProgramLineUpEntry } from "../../types/programLineUp";

const COLLECTION = "programLineUp";

export async function getLineUpForDate(date: string): Promise<ProgramLineUpEntry | null> {
  const ref = doc(db, COLLECTION, date);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as ProgramLineUpEntry) : null;
}

export async function getLineUpsInRange(dateFrom: string, dateTo: string): Promise<ProgramLineUpEntry[]> {
  const q = query(collection(db, COLLECTION), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as ProgramLineUpEntry)
    .filter((e) => e.date >= dateFrom && e.date <= dateTo);
}

export async function saveLineUp(entry: NewProgramLineUpEntry): Promise<void> {
  const ref = doc(db, COLLECTION, entry.date);
  const payload: ProgramLineUpEntry = { ...entry, dateModified: new Date().toISOString() };
  await setDoc(ref, payload, { merge: true });
}
