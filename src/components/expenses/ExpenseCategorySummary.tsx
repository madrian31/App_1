import type { CategoryTotal } from "../../hooks/useExpenses";
import { fmtPeso } from "../finance/financeFormat";
import { expenseCategoryIcon } from "./expenseCategoryIcon";

interface ExpenseCategorySummaryProps {
  loading: boolean;
  total: number;
  entryCount: number;
  categoryTotals: CategoryTotal[];
  monthLabel: string;
  activeCategory: string; // "" = all
  onSelectCategory: (category: string) => void;
}

/** Month total + one clickable card per category that has spending — clicking filters the table. */
export default function ExpenseCategorySummary({
  loading,
  total,
  entryCount,
  categoryTotals,
  monthLabel,
  activeCategory,
  onSelectCategory,
}: ExpenseCategorySummaryProps) {
  return (
    <div className="summary-cards">
      <button
        type="button"
        className={`summary-card expense-cat-card${activeCategory === "" ? " is-active" : ""}`}
        onClick={() => onSelectCategory("")}
      >
        <span className="summary-card-value" style={{ color: "var(--danger)" }}>
          {loading ? "…" : fmtPeso(total)}
        </span>
        <span className="summary-card-label">
          Total Expenses — {monthLabel} · {entryCount} {entryCount === 1 ? "entry" : "entries"}
        </span>
      </button>

      {!loading &&
        categoryTotals.map((c) => (
          <button
            type="button"
            key={c.category}
            className={`summary-card expense-cat-card${activeCategory === c.category ? " is-active" : ""}`}
            onClick={() => onSelectCategory(activeCategory === c.category ? "" : c.category)}
          >
            <span className="summary-card-value">{fmtPeso(c.total)}</span>
            <span className="summary-card-label">
              <i className={expenseCategoryIcon(c.category)} aria-hidden="true" /> {c.category}
            </span>
          </button>
        ))}
    </div>
  );
}
