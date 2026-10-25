import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { DepartmentFund, NewDepartmentFund } from "../../types/departmentFund";

const fundsCol = collection(db, "departmentFunds");

/** Every cash advance given within an inclusive date range (YYYY-MM-DD), oldest first.
 *  Range + orderBy on the same field only — no composite index needed. */
export async function getDepartmentFunds(dateFrom: string, dateTo: string): Promise<DepartmentFund[]> {
  const q = query(fundsCol, where("dateGiven", ">=", dateFrom), where("dateGiven", "<=", dateTo), orderBy("dateGiven", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Partial<DepartmentFund>;
    return {
      id: d.id,
      departmentId: data.departmentId ?? "",
      eventId: data.eventId ?? "",
      purpose: data.purpose ?? "",
      receivedBy: data.receivedBy ?? "",
      amountGiven: data.amountGiven ?? 0,
      dateGiven: data.dateGiven ?? "",
      amountSpent: data.amountSpent ?? 0,
      amountReturned: data.amountReturned ?? 0,
      dateReturned: data.dateReturned ?? "",
      notes: data.notes ?? "",
      addedBy: data.addedBy ?? "",
      dateAdded: data.dateAdded ?? "",
      dateModified: data.dateModified ?? "",
    };
  });
}

export async function addDepartmentFund(fund: NewDepartmentFund): Promise<string> {
  const nowISO = new Date().toISOString();
  const ref = await addDoc(fundsCol, { ...fund, dateAdded: nowISO, dateModified: nowISO });
  return ref.id;
}

export async function updateDepartmentFund(id: string, fund: NewDepartmentFund): Promise<void> {
  await updateDoc(doc(fundsCol, id), { ...fund, dateModified: new Date().toISOString() });
}

export async function deleteDepartmentFund(id: string): Promise<void> {
  await deleteDoc(doc(fundsCol, id));
}
