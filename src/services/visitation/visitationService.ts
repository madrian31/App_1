import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { Visit, NewVisit } from "../../types/visit";

const visitsCol = collection(db, "visits");

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function getAllVisits(): Promise<Visit[]> {
  const q = query(visitsCol, orderBy("date", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Visit));
}

export async function getVisitById(id: string): Promise<Visit | null> {
  const ref = doc(db, "visits", id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Visit) : null;
}

export async function addVisit(data: NewVisit): Promise<string> {
  const payload = stripUndefined(data);
  const docRef = await addDoc(visitsCol, payload);
  return docRef.id;
}

export async function updateVisit(id: string, data: Partial<Visit>): Promise<void> {
  const payload = stripUndefined(data);
  const ref = doc(db, "visits", id);
  await updateDoc(ref, payload);
}

export async function deleteVisit(id: string): Promise<void> {
  const ref = doc(db, "visits", id);
  await deleteDoc(ref);
}