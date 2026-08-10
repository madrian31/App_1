import { collection, doc, getDoc, getDocs, query, where, orderBy, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { Pledge } from "../../types/pledge";

const pledgesCol = collection(db, "pledges");

/** One pledge slot per member per calendar day. */
function buildPledgeId(memberId: string, date: string): string {
  return `${memberId}_${date}`;
}

/** Fetches one member's pledges within an inclusive date range (e.g. one month, for the tracker). */
export async function getPledgesForMember(memberId: string, dateFrom: string, dateTo: string): Promise<Pledge[]> {
  const q = query(
    pledgesCol,
    where("memberId", "==", memberId),
    where("date", ">=", dateFrom),
    where("date", "<=", dateTo)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pledge));
}

/** Fetches every member's pledges within an inclusive date range (e.g. a full year, for the report). */
export async function getAllPledges(dateFrom: string, dateTo: string): Promise<Pledge[]> {
  const q = query(pledgesCol, where("date", ">=", dateFrom), where("date", "<=", dateTo), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pledge));
}

/** Creates or updates the pledge for one member + date. `dateAdded` is only set on first
 *  write and preserved after that; `dateModified` updates on every save. */
export async function savePledge(
  memberId: string,
  memberName: string,
  date: string,
  amount: number,
  notes: string,
  currentUser: string
): Promise<void> {
  const id = buildPledgeId(memberId, date);
  const ref = doc(db, "pledges", id);
  const nowISO = new Date().toISOString();

  const existing = await getDoc(ref);
  const payload: Record<string, unknown> = {
    memberId,
    memberName,
    date,
    amount,
    notes,
    addedBy: currentUser,
    dateModified: nowISO,
  };
  if (!existing.exists()) {
    payload.dateAdded = nowISO;
  }

  await setDoc(ref, payload, { merge: true });
}
