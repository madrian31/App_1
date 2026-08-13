import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { SundaySchoolAttendanceRecord } from "../../types/sundaySchoolAttendance";

const ATTENDANCE_COLLECTION = "sundaySchoolAttendance";

/** One doc per month — "{year}-{month}" (month is zero-indexed). */
function monthDocId(year: number, month: number): string {
  return `${year}-${month}`;
}

/** Fetches the saved attendance map for one month, or {} if nothing has been saved yet. */
export async function getAttendanceForMonth(
  year: number,
  month: number
): Promise<Record<string, Record<number, boolean>>> {
  const ref = doc(db, ATTENDANCE_COLLECTION, monthDocId(year, month));
  const snap = await getDoc(ref);
  if (!snap.exists()) return {};
  const data = snap.data() as SundaySchoolAttendanceRecord;
  return data.records || {};
}

/** Toggles one child's attendance for one Sunday. Uses a nested-object merge so only
 *  records.{childId}.{day} is touched — other children/days in the same month doc are
 *  left untouched, same upsert pattern as sundaySchoolLineUpService.saveLineUp. */
export async function setAttendance(
  year: number,
  month: number,
  childId: string,
  day: number,
  present: boolean,
  currentUser: string
): Promise<void> {
  const ref = doc(db, ATTENDANCE_COLLECTION, monthDocId(year, month));
  const nowISO = new Date().toISOString();

  const existing = await getDoc(ref);
  const payload: Record<string, unknown> = {
    records: {
      [childId]: {
        [day]: present,
      },
    },
    dateModified: nowISO,
    addedBy: currentUser,
  };
  if (!existing.exists()) {
    payload.dateAdded = nowISO;
  }

  await setDoc(ref, payload, { merge: true });
}
