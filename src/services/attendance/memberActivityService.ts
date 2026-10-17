import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const ATTENDANCE_COLLECTION = "membersAttendance";

/**
 * IDs of members marked present at least once in the last `monthsBack` months
 * (current month included). Reads the same `membersAttendance` docs written by
 * useAttendanceTracker and the Attendance import (`year`, 0-indexed `month`, `days`).
 */
export async function getRecentAttendeeIds(monthsBack: number, now = new Date()): Promise<Set<string>> {
  const wanted = new Set<string>();
  const years = new Set<number>();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    wanted.add(`${d.getFullYear()}-${d.getMonth()}`);
    years.add(d.getFullYear());
  }

  const snap = await getDocs(
    query(collection(db, ATTENDANCE_COLLECTION), where("year", "in", Array.from(years)))
  );

  const ids = new Set<string>();
  snap.forEach((docSnap) => {
    const data = docSnap.data() as {
      trackeeId?: string;
      year?: number;
      month?: number;
      days?: Record<string, boolean>;
    };
    if (!data.trackeeId || data.year === undefined || data.month === undefined) return;
    if (!wanted.has(`${data.year}-${data.month}`)) return;
    if (data.days && Object.values(data.days).some(Boolean)) ids.add(data.trackeeId);
  });
  return ids;
}
