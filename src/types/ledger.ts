export type LedgerDepartment = "members" | "visitation" | "sundaySchool" | "pledges";

export const LEDGER_DEPARTMENT_LABELS: Record<LedgerDepartment, string> = {
  members: "Members/General",
  visitation: "Visitation",
  sundaySchool: "Sunday School",
  pledges: "Pledges",
};

/** DONATION = money given to the department by someone outside its regular giving
 *  (e.g. a non-pledger or a visitor giving to the Pledges fund). */
export type LedgerEntryType = "EXPENSE" | "LOAN_OUT" | "REPAYMENT" | "DONATION";

export interface LedgerEntry {
  id: string;
  department: LedgerDepartment;
  type: LedgerEntryType;
  category: string;
  amount: number;
  description: string;    // for a DONATION, an optional note
  /** DONATION only — who gave it. `donorMemberId` is "" for a non-member;
   *  `donorName` is "Anonymous" when a non-member left no name. */
  donorMemberId?: string;
  donorName?: string;
  dateAdded: string;      // ISO date string (YYYY-MM-DD)
  dateModified: string;
  modifiedBy: string;
}

export type NewLedgerEntry = Omit<LedgerEntry, "id" | "dateModified">;

/** What a ledger row says in a table — a donation leads with who gave it. */
export function ledgerEntryText(e: Pick<LedgerEntry, "type" | "description" | "donorName">): string {
  if (e.type !== "DONATION" || !e.donorName) return e.description;
  return e.description ? `From ${e.donorName} — ${e.description}` : `From ${e.donorName}`;
}

export interface LedgerTotals {
  totalExpenses: number;
  totalLoanOut: number;
  totalRepayment: number;
  totalDonations: number;
  netOutflow: number; // EXPENSE + LOAN_OUT − REPAYMENT − DONATION (negative = more came in than went out)
}