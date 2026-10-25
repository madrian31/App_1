/** Cash taken from the General Fund and handed to a department before its event or activity
 *  (a cash advance), and what the department reports back after it (liquidation).
 *  Stored in the `departmentFunds` collection.
 *
 *  General Fund effect: `amountGiven` leaves the fund on `dateGiven`, and `amountReturned` comes
 *  back on `dateReturned`. `amountSpent` is the department's receipts — that money already left
 *  the fund when it was given, so it is never subtracted again. */
export interface DepartmentFund {
  id: string;
  departmentId: string;
  /** The calendar activity this cash is for — its first day's event id (DepartmentActivity.key); "" when it isn't for one. */
  eventId: string;
  purpose: string; // the event or activity, e.g. "Youth Camp 2026"
  receivedBy: string; // who took the cash for the department
  amountGiven: number;
  dateGiven: string; // ISO date

  // ── Liquidation — filled in after the event ──
  amountSpent: number; // total of the receipts handed in; 0 until liquidated
  amountReturned: number; // unused cash given back to the General Fund
  dateReturned: string; // ISO date the unused cash came back; "" when nothing was returned
  notes: string;

  // ── System / meta fields ──
  addedBy: string;
  dateAdded: string; // ISO, set once on create
  dateModified: string; // ISO, updated on every edit
}

/** Shape used when saving — id/dateAdded/dateModified are derived by the service. */
export type NewDepartmentFund = Omit<DepartmentFund, "id" | "dateAdded" | "dateModified">;

type FundAmounts = Pick<DepartmentFund, "amountGiven" | "amountSpent" | "amountReturned">;

// Compare in centavos so ₱0.1 + ₱0.2 still equals ₱0.3.
const cents = (n: number) => Math.round((n || 0) * 100);

/** Cash the department still has to account for with receipts or by returning it. */
export function unliquidatedAmount(f: FundAmounts): number {
  return Math.max(cents(f.amountGiven) - cents(f.amountSpent) - cents(f.amountReturned), 0) / 100;
}

export type LiquidationStatus = "pending" | "partial" | "done";

export function liquidationStatus(f: FundAmounts): LiquidationStatus {
  const accounted = cents(f.amountSpent) + cents(f.amountReturned);
  if (accounted === 0) return "pending";
  return accounted >= cents(f.amountGiven) ? "done" : "partial";
}

export const LIQUIDATION_LABELS: Record<LiquidationStatus, string> = {
  pending: "Not yet liquidated",
  partial: "Partly liquidated",
  done: "Liquidated",
};

/** True when receipts plus returned cash add up to more than what was given. */
export function isOverAccounted(f: FundAmounts): boolean {
  return cents(f.amountSpent) + cents(f.amountReturned) > cents(f.amountGiven);
}
