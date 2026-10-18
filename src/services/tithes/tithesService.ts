import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { NewTithe, Tithe } from "../../types/tithe";

const tithesCol = collection(db, "tithes");

/** One tithe slot per member per calendar day — re-saving the same member+date
 *  overwrites instead of duplicating. Anonymous tithes use random ids instead. */
export function buildMemberTitheId(memberId: string, date: string): string {
  return `${memberId}_${date}`;
}

/** Fetches every tithe within an inclusive date range (YYYY-MM-DD), oldest first.
 *  Range + orderBy on the same field only — no composite index needed. */
export async function getTithes(dateFrom: string, dateTo: string): Promise<Tithe[]> {
  const q = query(tithesCol, where("date", ">=", dateFrom), where("date", "<=", dateTo), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Tithe));
}

export async function titheExists(id: string): Promise<boolean> {
  return (await getDoc(doc(db, "tithes", id))).exists();
}

/** Adds an anonymous / non-member tithe with a random id. */
export async function addTithe(tithe: NewTithe): Promise<string> {
  const nowISO = new Date().toISOString();
  const ref = await addDoc(tithesCol, { ...tithe, dateAdded: nowISO, dateModified: nowISO });
  return ref.id;
}

/** Creates or updates the tithe at `id`. `dateAdded` is only set on first write and
 *  preserved after that; `dateModified` updates on every save. */
export async function setTithe(id: string, tithe: NewTithe): Promise<void> {
  const ref = doc(db, "tithes", id);
  const nowISO = new Date().toISOString();
  const payload: Record<string, unknown> = { ...tithe, dateModified: nowISO };
  if (!(await getDoc(ref)).exists()) {
    payload.dateAdded = nowISO;
  }
  await setDoc(ref, payload, { merge: true });
}

export async function updateTithe(id: string, tithe: NewTithe): Promise<void> {
  await updateDoc(doc(db, "tithes", id), { ...tithe, dateModified: new Date().toISOString() });
}

export async function deleteTithe(id: string): Promise<void> {
  await deleteDoc(doc(db, "tithes", id));
}
