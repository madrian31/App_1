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

/** Keeps a queue in step with its current pool: ids no longer in the pool
 *  (archived, moved out of Council, or re-imported under a new member id)
 *  are dropped, and pool entries not queued yet join at the back. Everyone
 *  else keeps their place. Creates the doc if missing and only writes when
 *  something changed. An empty pool is treated as "not loaded" and leaves
 *  the queue as-is, so a failed member fetch can never wipe a rotation.
 *  `save: false` only works the order out (for view-only accounts, which can't write). */
export async function reconcileRotationQueue(
  role: RotationRole,
  poolIds: string[],
  { save = true }: { save?: boolean } = {}
): Promise<string[]> {
  const current = await getRotationQueue(role);
  const items = current?.items ?? [];
  if (poolIds.length === 0) return items;

  const pool = new Set(poolIds);
  const kept = items.filter((id, i) => pool.has(id) && items.indexOf(id) === i);
  const queued = new Set(kept);
  const next = [...kept, ...poolIds.filter((id) => !queued.has(id))];

  const unchanged = current && next.length === items.length && next.every((id, i) => id === items[i]);
  if (!unchanged && save) await saveRotationQueue(role, next);
  return next;
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
 *  invisible forever behind an already-seeded doc.
 *  `save: false` only works the order out (for view-only accounts, which can't write). */
export async function syncRotationQueueItems(
  role: RotationRole,
  validIds: string[],
  { save = true }: { save?: boolean } = {}
): Promise<string[]> {
  const current = await getRotationQueue(role);
  const existingItems = current?.items ?? [];
  const newItems = validIds.filter((id) => !existingItems.includes(id));

  if (newItems.length === 0 && current) {
    return existingItems; // wala namang bago, may doc na — skip write
  }

  const merged = [...newItems, ...existingItems];
  if (save) await saveRotationQueue(role, merged);
  return merged;
}