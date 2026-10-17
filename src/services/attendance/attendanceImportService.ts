import * as XLSX from "xlsx";
import { collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { Member } from "../../types/member";
import { parseAttendanceWorkbook, type AttendanceWorkbookParseResult } from "../../utils/attendanceExcelMapper";
import {
  NEW_VISITOR_PREFIX,
  type ExistingAttendance,
  type ImportPerson,
  type ImportPlan,
} from "../../utils/attendanceImportPlan";

const MEMBERS_COLLECTION = "members";
const ATTENDANCE_COLLECTION = "membersAttendance";
const BATCH_SIZE = 450; // Firestore caps a batch at 500 writes

/** Reads the .xlsx in the browser and parses every Worship Service sheet in it. */
export async function parseAttendanceFile(file: File): Promise<AttendanceWorkbookParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheets = workbook.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: "", raw: true }) as unknown[][],
  }));
  return parseAttendanceWorkbook(sheets);
}

/**
 * Every member doc, archived and visitors included, read straight from the
 * collection. Deliberately NOT getAllMembers(): that one orders by dateAdded,
 * and Firestore silently drops docs missing that field, which would make real
 * members look unmatched and get duplicated as visitors.
 */
export async function getAllMembersForMatching(): Promise<Member[]> {
  const snap = await getDocs(collection(db, MEMBERS_COLLECTION));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Member);
}

/** Current attendance for the given months, as trackeeId -> monthKey -> day -> present. */
export async function getExistingAttendance(monthKeys: string[]): Promise<ExistingAttendance> {
  const out: ExistingAttendance = {};
  // Firestore "in" takes at most 30 values.
  for (let i = 0; i < monthKeys.length; i += 30) {
    const chunk = monthKeys.slice(i, i + 30);
    if (chunk.length === 0) continue;
    const snap = await getDocs(query(collection(db, ATTENDANCE_COLLECTION), where("monthKey", "in", chunk)));
    snap.forEach((d) => {
      const data = d.data() as { trackeeId?: string; monthKey?: string; days?: Record<string, boolean> };
      if (!data.trackeeId || !data.monthKey) return;
      const days: Record<number, boolean> = {};
      Object.entries(data.days ?? {}).forEach(([day, v]) => (days[Number(day)] = Boolean(v)));
      (out[data.trackeeId] ??= {})[data.monthKey] = days;
    });
  }
  return out;
}

export interface ApplyImportSummary {
  visitorsCreated: number;
  attendanceDocsWritten: number;
  checksAdded: number;
  checksRemoved: number;
}

/**
 * 1) creates a member doc (isVisitor: true) for every new visitor,
 * 2) writes membersAttendance docs — same id/shape as useAttendanceTracker
 *    (`${trackeeId}_${year}-${month}`), merged so untouched days stay as they are.
 */
export async function applyAttendanceImport(
  plan: ImportPlan,
  people: ImportPerson[],
  addedBy: string,
  onProgress?: (done: number, total: number) => void
): Promise<ApplyImportSummary> {
  const membersCol = collection(db, MEMBERS_COLLECTION);
  const personByKey = new Map(people.map((p) => [p.key, p]));
  const today = new Date();
  const dateAdded = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  type Op = (batch: ReturnType<typeof writeBatch>) => void;
  const ops: Op[] = [];

  // New visitors get their real Firestore id up front, so attendance can point at it.
  const visitorIds = new Map<string, string>();
  for (const key of plan.newVisitorKeys) {
    const person = personByKey.get(key);
    if (!person) continue;
    const ref = doc(membersCol);
    visitorIds.set(key, ref.id);
    const { displayFirst, displayLast, displaySuffix, displayMiddle } = person.name;
    const visitor: Omit<Member, "id"> = {
      firstName: [displayFirst, displaySuffix].filter(Boolean).join(" ") || person.displayName,
      lastName: displayLast,
      middleInitial: displayMiddle,
      gender: "",
      birthday: "",
      isSmallGroupLeader: false,
      addedBy,
      dateAdded,
      isArchived: false,
      isPledger: false,
      isSundaySchoolTeacher: false,
      isSundaySchoolAssistantTeacher: false,
      isCouncilMember: false,
      isWorker: false,
      isVisitor: true,
    };
    ops.push((batch) => batch.set(ref, visitor));
  }

  for (const w of plan.writes) {
    const trackeeId = w.trackeeId.startsWith(NEW_VISITOR_PREFIX)
      ? visitorIds.get(w.trackeeId.slice(NEW_VISITOR_PREFIX.length))
      : w.trackeeId;
    if (!trackeeId) continue;
    const ref = doc(db, ATTENDANCE_COLLECTION, `${trackeeId}_${w.monthKey}`);
    ops.push((batch) =>
      batch.set(
        ref,
        { trackeeId, monthKey: w.monthKey, year: w.year, month: w.month, days: w.days },
        { merge: true }
      )
    );
  }

  let done = 0;
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    ops.slice(i, i + BATCH_SIZE).forEach((op) => op(batch));
    await batch.commit();
    done += Math.min(BATCH_SIZE, ops.length - i);
    onProgress?.(done, ops.length);
  }

  return {
    visitorsCreated: visitorIds.size,
    attendanceDocsWritten: plan.writes.length,
    checksAdded: plan.checksAdded,
    checksRemoved: plan.checksRemoved,
  };
}
