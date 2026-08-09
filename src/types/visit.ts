export interface Visit {
  id: string;
  memberId: string;
  memberName: string;
  department: string;
  leader: string;
  purpose: string;
  participants: string[];
  notes: string;
  date: string;

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string;
}

/** Shape used when creating a new visit (id is assigned by Firestore). */
export type NewVisit = Omit<Visit, "id">;