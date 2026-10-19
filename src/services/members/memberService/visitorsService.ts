import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import { toLocalISODate } from "../../../utils/date";

// Same collection the Attendance page and attendance import write to.
const ATTENDANCE_COLLECTION = "membersAttendance";

export interface VisitorAttendanceStats {
  timesAttended: number;
  firstVisit: string; // ISO date, "" if never marked present
  lastVisit: string; // ISO date, "" if never marked present
}

/** Times present + first/last visit for each visitor, from their attendance docs
 *  (`{ trackeeId, year, month (0-based), days: { [day]: boolean } }`). */
export async function getVisitorAttendanceStats(visitorIds: string[]): Promise<Record<string, VisitorAttendanceStats>> {
  const out: Record<string, VisitorAttendanceStats> = {};
  visitorIds.forEach((id) => (out[id] = { timesAttended: 0, firstVisit: "", lastVisit: "" }));

  // Firestore "in" takes at most 30 values.
  for (let i = 0; i < visitorIds.length; i += 30) {
    const chunk = visitorIds.slice(i, i + 30);
    const snap = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where("trackeeId", "in", chunk)));
    snap.forEach((d) => {
      const data = d.data() as { trackeeId?: string; year?: number; month?: number; days?: Record<string, boolean> };
      if (!data.trackeeId || data.year === undefined || data.month === undefined || !out[data.trackeeId]) return;
      const stats = out[data.trackeeId];
      Object.entries(data.days ?? {}).forEach(([day, present]) => {
        if (!present) return;
        const iso = toLocalISODate(new Date(data.year!, data.month!, Number(day)));
        stats.timesAttended += 1;
        if (!stats.firstVisit || iso < stats.firstVisit) stats.firstVisit = iso;
        if (!stats.lastVisit || iso > stats.lastVisit) stats.lastVisit = iso;
      });
    });
  }
  return out;
}

/** Turns a visitor into a regular member — they then show up in Members, reports and Tithes. */
export async function makeVisitorMember(id: string): Promise<void> {
  await updateDoc(doc(db, "members", id), { isVisitor: false });
}

/** Permanently deletes a visitor (e.g. a misspelled or duplicate name from an import)
 *  together with their attendance records, so no orphaned attendance is left behind. */
export async function deleteVisitor(id: string): Promise<void> {
  const attendance = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where("trackeeId", "==", id)));
  const batch = writeBatch(db);
  attendance.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await deleteDoc(doc(db, "members", id));
}
