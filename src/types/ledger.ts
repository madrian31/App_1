export type LedgerDepartment = "members" | "visitation" | "sundaySchool" | "pledges";

export const LEDGER_DEPARTMENT_LABELS: Record<LedgerDepartment, string> = {
  members: "Members/General",
  visitation: "Visitation",
  sundaySchool: "Sunday School",
  pledges: "Pledges",
};

export type LedgerEntryType = "EXPENSE" | "LOAN_OUT" | "REPAYMENT";

export interface LedgerEntry {
  id: string;
  department: LedgerDepartment;
  type: LedgerEntryType;
  category: string;
  amount: number;
  description: string;
  dateAdded: string;      // ISO date string (YYYY-MM-DD)
  dateModified: string;
  modifiedBy: string;
}

export type NewLedgerEntry = Omit<LedgerEntry, "id" | "dateModified">;

export interface LedgerTotals {
  totalExpenses: number;
  totalLoanOut: number;
  totalRepayment: number;
  netOutflow: number;
}