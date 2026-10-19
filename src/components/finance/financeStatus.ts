export type FinanceStatusKind = "empty" | "surplus" | "balanced" | "covered" | "deficit";

export interface FinanceStatus {
  kind: FinanceStatusKind;
  icon: string; // Font Awesome solid icon name
  headline: string;
  detail: string;
  /** The one amount that matters for this status — shown large under the headline. */
  figure: { value: string; label: string } | null;
}

/**
 * The period's financial status, shared by the on-screen card and the PDF so both say
 * the same thing. It answers "did the fund go up or down?" and names the amount that
 * matters: how much was added, or how much more tithes & offerings were needed to cover expenses.
 * The full numbers are already in the breakdown beside it.
 *
 * `money` formats amounts — "₱" on screen, "PHP" in the PDF (its fonts can't draw "₱").
 */
export function getFinanceStatus(
  income: number, // tithes + offerings
  expenses: number,
  remainingBalance: number,
  inPeriod: string, // "in October 2026" / "(Mar 1, 2026 – Sep 15, 2026)"
  money: (n: number) => string
): FinanceStatus {
  const diff = Math.abs(income - expenses);

  if (income === 0 && expenses === 0) {
    return {
      kind: "empty",
      icon: "fa-circle-minus",
      headline: "No Records",
      detail: `No tithes, offerings or expenses ${inPeriod}.`,
      figure: null,
    };
  }
  if (remainingBalance < 0) {
    return {
      kind: "deficit",
      icon: "fa-triangle-exclamation",
      headline: "Not Enough Funds",
      detail: `The fund does not have enough money to pay the expenses ${inPeriod}.`,
      figure: { value: money(-remainingBalance), label: "Still needed to pay all expenses" },
    };
  }
  if (expenses > income) {
    return {
      kind: "covered",
      icon: "fa-arrow-down",
      headline: "Fund Decreased",
      detail: `Tithes and offerings were not enough for the expenses ${inPeriod}, so the difference was taken from the fund.`,
      figure: { value: money(diff), label: "More tithes & offerings needed to cover the expenses" },
    };
  }
  if (income > expenses) {
    return {
      kind: "surplus",
      icon: "fa-arrow-up",
      headline: "Fund Increased",
      detail: `Tithes and offerings covered all the expenses ${inPeriod}, with money left over.`,
      figure: { value: `+${money(diff)}`, label: "Added to the fund" },
    };
  }
  return {
    kind: "balanced",
    icon: "fa-equals",
    headline: "No Change",
    detail: `Tithes and offerings were the same as the expenses ${inPeriod}.`,
    figure: null,
  };
}
