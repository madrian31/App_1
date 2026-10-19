import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { NewOffering, Offering } from "../../types/offering";

const offeringsCol = collection(db, "offerings");

/** Fetches every service offering within an inclusive date range (YYYY-MM-DD), oldest first.
 *  Range + orderBy on the same field only — no composite index needed. */
export async function getOfferings(dateFrom: string, dateTo: string): Promise<Offering[]> {
  const q = query(offeringsCol, where("date", ">=", dateFrom), where("date", "<=", dateTo), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offering));
}

/** Creates or updates the offering for one service date. `dateAdded` is only set on the
 *  first write; `dateModified` updates on every save. */
export async function saveOffering(offering: NewOffering): Promise<void> {
  const ref = doc(db, "offerings", offering.date);
  const nowISO = new Date().toISOString();
  const payload: Record<string, unknown> = { ...offering, dateModified: nowISO };
  if (!(await getDoc(ref)).exists()) {
    payload.dateAdded = nowISO;
  }
  await setDoc(ref, payload, { merge: true });
}

export async function deleteOffering(date: string): Promise<void> {
  await deleteDoc(doc(db, "offerings", date));
}
