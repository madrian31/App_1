import { Link } from "react-router-dom";
import { EXPENSE_MONTHS } from "../../hooks/useExpenses";

interface ExpensesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: string[];
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  curMonth: number;
  onMonthChange: (month: number) => void;
  curYear: number;
  onYearChange: (year: number) => void;
  years: number[];
  canManage: boolean;
  onAddEntry: () => void;
  onExportCSV: () => void;
  exportDisabled: boolean;
}

export default function ExpensesToolbar({
  search,
  onSearchChange,
  categories,
  categoryFilter,
  onCategoryChange,
  curMonth,
  onMonthChange,
  curYear,
  onYearChange,
  years,
  canManage,
  onAddEntry,
  onExportCSV,
  exportDisabled,
}: ExpensesToolbarProps) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search description…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="filter-select-wrap">
        <i className="fa-solid fa-filter" aria-hidden="true" />
        <select value={categoryFilter} onChange={(e) => onCategoryChange(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-select-wrap">
        <i className="fa-regular fa-calendar" aria-hidden="true" />
        <select value={curMonth} onChange={(e) => onMonthChange(Number(e.target.value))}>
          {EXPENSE_MONTHS.map((m, i) => (
            <option key={i} value={i}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-select-wrap">
        <select value={curYear} onChange={(e) => onYearChange(Number(e.target.value))}>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Link to="/Settings/ManageLists" className="btn-secondary expense-manage-link" title="Add or rename categories">
        <i className="fa-solid fa-list-check" aria-hidden="true" />
        Categories
      </Link>

      <button className="btn-secondary" onClick={onExportCSV} disabled={exportDisabled}>
        <i className="fa-solid fa-file-export" aria-hidden="true" />
        Export CSV
      </button>

      {canManage && (
        <button className="btn-add" onClick={onAddEntry}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add Expense
        </button>
      )}
    </div>
  );
}
