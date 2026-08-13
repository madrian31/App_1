import { collection, doc, getDoc, getDocs, query, where, orderBy, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { AssistantTeacherRef, SundaySchoolLineUpEntry } from "../../types/sundaySchoolLineUp";

const lineUpCol = collection(db, "sundaySchoolLineUp");

/** Fetches the lineup for one specific Sunday, or null if nothing has been saved yet. */
export async function getLineUpForDate(date: string): Promise<SundaySchoolLineUpEntry | null> {
  const ref = doc(db, "sundaySchoolLineUp", date);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SundaySchoolLineUpEntry) : null;
}

/** Fetches every saved lineup within an inclusive date range — useful for a future history/report view. */
export async function getLineUpsInRange(dateFrom: string, dateTo: string): Promise<SundaySchoolLineUpEntry[]> {
  const q = query(lineUpCol, where("date", ">=", dateFrom), where("date", "<=", dateTo), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SundaySchoolLineUpEntry));
}

/** Creates or updates the lineup for a given Sunday. One doc per date (upsert), so re-saving
 *  the same Sunday safely overwrites instead of duplicating. */
export async function saveLineUp(
  date: string,
  teacherId: string,
  teacherName: string,
  assistantTeachers: AssistantTeacherRef[],
  topic: string,
  notes: string,
  currentUser: string
): Promise<void> {
  const ref = doc(db, "sundaySchoolLineUp", date);
  const nowISO = new Date().toISOString();

  const existing = await getDoc(ref);
  const payload: Record<string, unknown> = {
    date,
    teacherId,
    teacherName,
    assistantTeachers,
    topic,
    notes,
    addedBy: currentUser,
    dateModified: nowISO,
  };
  if (!existing.exists()) {
    payload.dateAdded = nowISO;
  }

  await setDoc(ref, payload, { merge: true });
}
