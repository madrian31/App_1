import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { Expense, NewExpense } from "../../types/expense";

const expensesCol = collection(db, "expenses");

/** Fetches every expense within an inclusive date range (YYYY-MM-DD), oldest first.
 *  Range + orderBy on the same field only — no composite index needed. */
export async function getExpenses(dateFrom: string, dateTo: string): Promise<Expense[]> {
  const q = query(expensesCol, where("date", ">=", dateFrom), where("date", "<=", dateTo), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
}

export async function addExpense(expense: NewExpense): Promise<string> {
  const nowISO = new Date().toISOString();
  const ref = await addDoc(expensesCol, { ...expense, dateAdded: nowISO, dateModified: nowISO });
  return ref.id;
}

export async function updateExpense(id: string, expense: NewExpense): Promise<void> {
  await updateDoc(doc(db, "expenses", id), { ...expense, dateModified: new Date().toISOString() });
}

export async function deleteExpense(id: string): Promise<void> {
  await deleteDoc(doc(db, "expenses", id));
}
