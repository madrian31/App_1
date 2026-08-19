import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { ThemePreset } from "../../types/themePreset";

const COLLECTION = "themePresets";

export async function getThemePresets(): Promise<ThemePreset[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ThemePreset));
}

export async function addThemePreset(title: string, verse: string): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), { title, verse });
  return ref.id;
}

export async function updateThemePreset(id: string, title: string, verse: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { title, verse });
}

export async function removeThemePreset(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}