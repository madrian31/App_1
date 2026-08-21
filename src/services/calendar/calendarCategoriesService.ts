import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { DEFAULT_CATEGORIES, type CalendarCategoryItem } from "../../types/calendarEvent";

const COLLECTION = "calendarCategories";
const categoriesCol = collection(db, COLLECTION);

export async function getAllCategories(): Promise<CalendarCategoryItem[]> {
  const snap = await getDocs(categoriesCol);
  const categories = snap.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarCategoryItem));
  // Firestore's default order (no orderBy) is by document id, which only
  // looks alphabetical-by-label because the seed docs happen to use
  // lowercase-label ids. Sorting explicitly here keeps the order correct
  // and predictable even after a category is renamed.
  return categories.sort((a, b) => a.label.localeCompare(b.label));
}

export async function addCategory(label: string, icon: string, color: string): Promise<string> {
  const ref = await addDoc(categoriesCol, { label, icon, color });
  return ref.id;
}

export async function updateCategory(id: string, data: Partial<Omit<CalendarCategoryItem, "id">>): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), data);
}

export async function removeCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Seeds the original 9 default categories — using their original keys as doc
 * ids for stability — only if the collection doesn't have any yet. Safe to
 * call on every page load, same pattern as seedLookupListIfEmpty /
 * seedRotationQueueIfEmpty.
 */
export async function seedCategoriesIfEmpty(): Promise<void> {
  const snap = await getDocs(categoriesCol);
  if (!snap.empty) return;

  const batch = writeBatch(db);
  DEFAULT_CATEGORIES.forEach((cat) => {
    const { id, ...rest } = cat;
    batch.set(doc(db, COLLECTION, id), rest);
  });
  await batch.commit();
}