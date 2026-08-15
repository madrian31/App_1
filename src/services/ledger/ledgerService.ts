import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { LedgerDepartment, LedgerEntry, NewLedgerEntry } from "../../types/ledger";

const COLLECTION = "ledger";

/**
 * NOTE: this query filters by `department` (equality) and `dateAdded`
 * (range) at the same time, plus an orderBy on `dateAdded`. Firestore will
 * ask you to create a composite index the first time this runs — click the
 * link in the console error once and it's done for good.
 */

function toISODate(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  return "";
}

function fromDoc(id: string, data: Record<string, unknown>): LedgerEntry {
  return {
    id,
    department: (data.department as LedgerDepartment) ?? "members",
    type: (data.type as LedgerEntry["type"]) ?? "EXPENSE",
    category: (data.category as string) ?? "",
    amount: (data.amount as number) ?? 0,
    description: (data.description as string) ?? "",
    dateAdded: toISODate(data.dateAdded),
    dateModified: toISODate(data.dateModified),
    modifiedBy: (data.modifiedBy as string) ?? "",
  };
}

/** Fetch all entries for a department within an inclusive date range (YYYY-MM-DD). */
export async function getLedgerEntries(
  department: LedgerDepartment,
  dateFrom: string,
  dateTo: string
): Promise<LedgerEntry[]> {
  const start = Timestamp.fromDate(new Date(`${dateFrom}T00:00:00`));
  const end = Timestamp.fromDate(new Date(`${dateTo}T23:59:59`));

  const q = query(
    collection(db, COLLECTION),
    where("department", "==", department),
    where("dateAdded", ">=", start),
    where("dateAdded", "<=", end),
    orderBy("dateAdded", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data()));
}

export async function addLedgerEntry(entry: NewLedgerEntry): Promise<string> {
  const payload = {
    department: entry.department,
    type: entry.type,
    category: entry.category,
    amount: entry.amount,
    description: entry.description,
    dateAdded: Timestamp.fromDate(new Date(`${entry.dateAdded}T00:00:00`)),
    dateModified: Timestamp.fromDate(new Date()),
    modifiedBy: entry.modifiedBy,
  };
  const ref = await addDoc(collection(db, COLLECTION), payload);
  return ref.id;
}

export async function updateLedgerEntry(id: string, entry: NewLedgerEntry): Promise<void> {
  const payload = {
    department: entry.department,
    type: entry.type,
    category: entry.category,
    amount: entry.amount,
    description: entry.description,
    dateAdded: Timestamp.fromDate(new Date(`${entry.dateAdded}T00:00:00`)),
    dateModified: Timestamp.fromDate(new Date()),
    modifiedBy: entry.modifiedBy,
  };
  await updateDoc(doc(db, COLLECTION, id), payload);
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

/**
 * Net outflow (EXPENSE + LOAN_OUT − REPAYMENT) for a department within a
 * date range — used by reports (e.g. Pledges Report's Net Balance KPI)
 * that need a single number without pulling in the full entry list.
 */
export async function getLedgerNetOutflow(
  department: LedgerDepartment,
  dateFrom: string,
  dateTo: string
): Promise<number> {
  const entries = await getLedgerEntries(department, dateFrom, dateTo);
  return entries.reduce((sum, e) => {
    if (e.type === "REPAYMENT") return sum - e.amount;
    return sum + e.amount; // EXPENSE + LOAN_OUT
  }, 0);
}
