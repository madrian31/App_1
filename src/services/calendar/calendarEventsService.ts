import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { CalendarEvent } from "../../types/calendarEvent";

const eventsCol = collection(db, "calendarEvents");

export type NewCalendarEvent = Omit<CalendarEvent, "id">;

function stripUndefined<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

export async function getAllEvents(): Promise<CalendarEvent[]> {
  const q = query(eventsCol, orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CalendarEvent));
}

export async function addEvent(data: NewCalendarEvent): Promise<string> {
  const payload = stripUndefined(data);
  const docRef = await addDoc(eventsCol, payload);
  return docRef.id;
}

export async function updateEvent(id: string, data: Partial<CalendarEvent>): Promise<void> {
  const payload = stripUndefined(data);
  const ref = doc(db, "calendarEvents", id);
  await updateDoc(ref, payload);
}

export async function deleteEvent(id: string): Promise<void> {
  const ref = doc(db, "calendarEvents", id);
  await deleteDoc(ref);
}

/**
 * Writes multiple events in one batch — used by .ics import, which can bring
 * in dozens of events at once. Mirrors the batching approach in
 * memberImportExport.bulkImportMembers, but simpler: ICS imports don't carry
 * a stable id to de-dupe against, so every parsed event is always inserted
 * as new (Firestore auto-generates the doc id) rather than upserted.
 * Firestore's hard limit is 500 writes per batch — 450 leaves headroom.
 */
export async function bulkAddEvents(events: NewCalendarEvent[]): Promise<CalendarEvent[]> {
  const BATCH_SIZE = 450;
  const written: CalendarEvent[] = [];

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const chunk = events.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const refs = chunk.map(() => doc(eventsCol));

    chunk.forEach((event, idx) => {
      batch.set(refs[idx], stripUndefined(event));
    });

    await batch.commit();
    chunk.forEach((event, idx) => written.push({ ...event, id: refs[idx].id }));
  }

  return written;
}
