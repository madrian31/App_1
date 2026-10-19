export type FinanceStatusKind = "empty" | "surplus" | "balanced" | "covered" | "deficit";

export interface FinanceStatus {
  kind: FinanceStatusKind;
  icon: string; // Font Awesome solid icon name
  headline: string;
  detail: string;
}

/**
 * The period's financial status, shared by the on-screen card and the PDF so both say
 * the same thing. The explanation reuses the exact words and amounts shown in the
 * breakdown (Tithes, Expenses, Previous Balance, Remaining Balance) so readers can trace it.
 * A period whose tithes fall short is only a real shortfall if the previous balance can't cover it.
 *
 * `money` formats amounts — "₱" on screen, "PHP" in the PDF (its fonts can't draw "₱").
 */
export function getFinanceStatus(
  tithes: number,
  expenses: number,
  previousBalance: number,
  remainingBalance: number,
  inPeriod: string, // "in October 2026" / "(Mar 1, 2026 – Sep 15, 2026)"
  money: (n: number) => string
): FinanceStatus {
  const diff = Math.abs(tithes - expenses);

  if (tithes === 0 && expenses === 0) {
    return {
      kind: "empty",
      icon: "fa-circle-minus",
      headline: "No Records",
      detail: `No tithes or expenses were recorded ${inPeriod}.`,
    };
  }
  if (remainingBalance < 0) {
    return {
      kind: "deficit",
      icon: "fa-triangle-exclamation",
      headline: "Not Enough Funds",
      detail: `Expenses (${money(expenses)}) were higher than tithes (${money(tithes)}) by ${money(diff)}, but the Previous Balance was only ${money(previousBalance)}. The fund is short by ${money(-remainingBalance)}.`,
    };
  }
  if (expenses > tithes) {
    return {
      kind: "covered",
      icon: "fa-circle-info",
      headline: "Paid from Savings",
      detail: `Expenses (${money(expenses)}) were higher than tithes (${money(tithes)}) by ${money(diff)}. The ${money(diff)} was taken from the Previous Balance of ${money(previousBalance)}, leaving ${money(remainingBalance)}.`,
    };
  }
  if (tithes > expenses) {
    return {
      kind: "surplus",
      icon: "fa-arrow-trend-up",
      headline: "Surplus",
      detail: `Tithes (${money(tithes)}) were higher than expenses (${money(expenses)}) by ${money(diff)}. The ${money(diff)} was added to the Previous Balance of ${money(previousBalance)}, making it ${money(remainingBalance)}.`,
    };
  }
  return {
    kind: "balanced",
    icon: "fa-scale-balanced",
    headline: "Balanced",
    detail: `Tithes and expenses were both ${money(tithes)}. The balance stayed at ${money(remainingBalance)}.`,
  };
}
