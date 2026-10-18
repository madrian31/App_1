/** A General Fund expense (utility bill, supplies, repairs…). Stored in the `expenses` collection. */
export interface Expense {
  id: string;

  /** One of the "Expense Category" lookup list values (Settings → Manage Lists). */
  category: string;
  description: string;
  amount: number;
  date: string; // ISO date string, e.g. "2026-10-18" — the date paid

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string; // ISO, set once on create
  dateModified: string; // ISO, updated on every edit
}

/** Shape used when saving an expense — id/dateAdded/dateModified are derived by the service. */
export type NewExpense = Omit<Expense, "id" | "dateAdded" | "dateModified">;

/** Seeded into the "expenseCategory" lookup list the first time it's loaded. */
export const EXPENSE_CATEGORY_SEED = ["Electricity", "Internet", "Water", "Supplies", "Repairs & Maintenance", "Others"];
