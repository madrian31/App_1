import { doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { RotationQueue, RotationRole } from "../../types/rotationQueue";
import { advanceQueue } from "../../types/rotationQueue";

const COLLECTION = "rotationQueues";

export async function getRotationQueue(role: RotationRole): Promise<RotationQueue | null> {
  const ref = doc(db, COLLECTION, role);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as RotationQueue) : null;
}

export async function getAllRotationQueues(): Promise<RotationQueue[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => d.data() as RotationQueue);
}

/** Creates the queue doc with an initial ordered list — only if it doesn't
 *  exist yet. Safe to call on every page load, like seedLookupListIfEmpty. */
export async function seedRotationQueueIfEmpty(role: RotationRole, items: string[]): Promise<void> {
  const ref = doc(db, COLLECTION, role);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  const payload: RotationQueue = { id: role, role, items, dateModified: new Date().toISOString() };
  await setDoc(ref, payload);
}

/** Overwrites the full ordered list — used by the manual "edit rotation order" UI. */
export async function saveRotationQueue(role: RotationRole, items: string[]): Promise<void> {
  const ref = doc(db, COLLECTION, role);
  await setDoc(ref, { id: role, role, items, dateModified: new Date().toISOString() } as RotationQueue);
}

/** Moves `usedId` to the back of the queue — call this after an assignment
 *  (auto pick from the front, OR a manual out-of-turn reassign) is saved. */
export async function advanceRotationQueue(role: RotationRole, usedId: string): Promise<void> {
  const current = await getRotationQueue(role);
  const items = current?.items ?? [];
  const next = advanceQueue(items, usedId);
  await saveRotationQueue(role, next);
}

/** Merges any `validIds` not yet present in the queue onto the back —
 *  preserves existing order/position for ids already there. Unlike
 *  seedRotationQueueIfEmpty, this runs every time (not just on an empty/
 *  missing doc), so newly-added items — like a fresh theme preset created
 *  after the queue doc already existed — always show up instead of being
 *  invisible forever behind an already-seeded doc. */
export async function syncRotationQueueItems(role: RotationRole, validIds: string[]): Promise<string[]> {
  const current = await getRotationQueue(role);
  const existingItems = current?.items ?? [];
  const newItems = validIds.filter((id) => !existingItems.includes(id));

  if (newItems.length === 0 && current) {
    return existingItems; // wala namang bago, may doc na — skip write
  }

  const merged = [...newItems, ...existingItems]; 
  await saveRotationQueue(role, merged);
  return merged;
}