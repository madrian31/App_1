import { LEDGER_MONTHS } from "../../hooks/useLedger";

interface LedgerToolbarProps {
  curMonth: number;
  onMonthChange: (month: number) => void;
  curYear: number;
  onYearChange: (year: number) => void;
  years: number[];
  canManage: boolean;
  onAddEntry: () => void;
}

export default function LedgerToolbar({
  curMonth,
  onMonthChange,
  curYear,
  onYearChange,
  years,
  canManage,
  onAddEntry,
}: LedgerToolbarProps) {
  return (
    <div className="toolbar">
      <div className="filter-select-wrap">
        <i className="fa-regular fa-calendar" aria-hidden="true" />
        <select value={curMonth} onChange={(e) => onMonthChange(Number(e.target.value))}>
          {LEDGER_MONTHS.map((m, i) => (
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

      {canManage && (
        <button className="btn-add" onClick={onAddEntry}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Add Entry
        </button>
      )}
    </div>
  );
}
