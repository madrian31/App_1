export type FinanceStatusKind = "empty" | "surplus" | "balanced" | "covered" | "deficit";

export interface FinanceStatus {
  kind: FinanceStatusKind;
  icon: string; // Font Awesome solid icon name
  headline: string;
  detail: string;
}

/**
 * The period's financial status, shared by the on-screen card and the PDF so both say
 * the same thing. It answers one question — did the fund go up or down? — in one short
 * sentence; the full numbers are already in the breakdown beside it.
 *
 * `money` formats amounts — "₱" on screen, "PHP" in the PDF (its fonts can't draw "₱").
 */
export function getFinanceStatus(
  tithes: number,
  expenses: number,
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
      detail: `No tithes or expenses ${inPeriod}.`,
    };
  }
  if (remainingBalance < 0) {
    return {
      kind: "deficit",
      icon: "fa-triangle-exclamation",
      headline: "Not Enough Funds",
      detail: `Expenses were more than the money available. The fund is short by ${money(-remainingBalance)}.`,
    };
  }
  if (expenses > tithes) {
    return {
      kind: "covered",
      icon: "fa-arrow-down",
      headline: "Fund Decreased",
      detail: `Expenses were more than tithes. The fund went down by ${money(diff)}.`,
    };
  }
  if (tithes > expenses) {
    return {
      kind: "surplus",
      icon: "fa-arrow-up",
      headline: "Fund Increased",
      detail: `Tithes were more than expenses. The fund went up by ${money(diff)}.`,
    };
  }
  return {
    kind: "balanced",
    icon: "fa-equals",
    headline: "No Change",
    detail: "Tithes and expenses were the same.",
  };
}
