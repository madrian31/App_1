import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import type { Member } from "../../../types/member";

const membersCol = collection(db, "members");

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function getAllMembers(): Promise<Member[]> {
  const q = query(membersCol, orderBy("dateAdded", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Member));
}

export async function getMemberById(id: string): Promise<Member | null> {
  const ref = doc(db, "members", id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Member) : null;
}

export async function addMember(data: Omit<Member, "id">): Promise<string> {
  const payload = stripUndefined(data);
  const docRef = await addDoc(membersCol, payload);
  return docRef.id;
}

export async function updateMember(id: string, data: Partial<Member>): Promise<void> {
  const payload = stripUndefined(data);
  const ref = doc(db, "members", id);
  await updateDoc(ref, payload);
}

export async function archiveMember(id: string): Promise<void> {
  const ref = doc(db, "members", id);
  await updateDoc(ref, { isArchived: true });
}
