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
import { toLocalISODate } from "../../utils/date";

const COLLECTION = "ledger";

function toISODate(value: unknown): string {
  if (value instanceof Timestamp) return toLocalISODate(value.toDate());
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
    donorMemberId: (data.donorMemberId as string) || "",
    donorName: (data.donorName as string) || "",
    dateAdded: toISODate(data.dateAdded),
    dateModified: toISODate(data.dateModified),
    modifiedBy: (data.modifiedBy as string) ?? "",
  };
}

/** Fetch all entries for a department within an inclusive date range (YYYY-MM-DD).
 *  Filters on `dateAdded` only and picks the department out afterwards, so it works
 *  without a composite index (department + a date range would need one). */
export async function getLedgerEntries(
  department: LedgerDepartment,
  dateFrom: string,
  dateTo: string
): Promise<LedgerEntry[]> {
  const start = Timestamp.fromDate(new Date(`${dateFrom}T00:00:00`));
  const end = Timestamp.fromDate(new Date(`${dateTo}T23:59:59`));

  const q = query(
    collection(db, COLLECTION),
    where("dateAdded", ">=", start),
    where("dateAdded", "<=", end),
    orderBy("dateAdded", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => fromDoc(d.id, d.data())).filter((e) => e.department === department);
}

export async function addLedgerEntry(entry: NewLedgerEntry): Promise<string> {
  const payload = {
    department: entry.department,
    type: entry.type,
    category: entry.category,
    amount: entry.amount,
    description: entry.description,
    donorMemberId: entry.donorMemberId ?? "",
    donorName: entry.donorName ?? "",
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
    donorMemberId: entry.donorMemberId ?? "",
    donorName: entry.donorName ?? "",
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
 * Net outflow (EXPENSE + LOAN_OUT − REPAYMENT − DONATION) for a department within a
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
    if (e.type === "REPAYMENT" || e.type === "DONATION") return sum - e.amount;
    return sum + e.amount; // EXPENSE + LOAN_OUT
  }, 0);
}
