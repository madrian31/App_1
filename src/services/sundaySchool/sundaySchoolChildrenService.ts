import { collection, doc, getDocs, getDoc, addDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { SundaySchoolChild } from "../../types/sundaySchoolChild";

const childrenCol = collection(db, "sundaySchoolChildren");

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>;
}

export async function getAllChildren(): Promise<SundaySchoolChild[]> {
  const q = query(childrenCol, orderBy("dateEnrolled", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SundaySchoolChild));
}

export async function getChildById(id: string): Promise<SundaySchoolChild | null> {
  const ref = doc(db, "sundaySchoolChildren", id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as SundaySchoolChild) : null;
}

export async function addChild(data: Omit<SundaySchoolChild, "id">): Promise<string> {
  const payload = stripUndefined(data);
  const docRef = await addDoc(childrenCol, payload);
  return docRef.id;
}

export async function updateChild(id: string, data: Partial<SundaySchoolChild>): Promise<void> {
  const payload = stripUndefined(data);
  const ref = doc(db, "sundaySchoolChildren", id);
  await updateDoc(ref, payload);
}

/** Toggles active/dropped status — the roster equivalent of Members' archive/unarchive. */
export async function setChildActive(id: string, isActive: boolean): Promise<void> {
  const ref = doc(db, "sundaySchoolChildren", id);
  await updateDoc(ref, { isActive });
}
