import { useState } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthStartISO(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}
function monthEndISO(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10);
}

interface AutoGenerateModalProps {
  generating: boolean;
  onGenerate: (dateFrom: string, dateTo: string) => void;
  onClose: () => void;
}

export default function AutoGenerateModal({ generating, onGenerate, onClose }: AutoGenerateModalProps) {
  const now = new Date();
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [fromMonth, setFromMonth] = useState(now.getMonth());
  const [fromYear, setFromYear] = useState(now.getFullYear());
  const [toMonth, setToMonth] = useState(nextMonthDate.getMonth());
  const [toYear, setToYear] = useState(nextMonthDate.getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 1 + i);

  function handleGenerate() {
    onGenerate(monthStartISO(fromYear, fromMonth), monthEndISO(toYear, toMonth));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Auto-Generate Line-ups</h2>
        <p className="pledger-checklist-hint">
          Fills in every Sunday and Wednesday in this range using the current rotation — front of each queue,
          advancing automatically. Dates that already have a saved line-up are left untouched.
        </p>

        <div className="month-range-wrap" style={{ marginBottom: 18 }}>
          <div className="filter-select-wrap">
            <select value={fromMonth} onChange={(e) => setFromMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div className="filter-select-wrap">
            <select value={fromYear} onChange={(e) => setFromYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <span className="month-range-arrow">→</span>

          <div className="filter-select-wrap">
            <select value={toMonth} onChange={(e) => setToMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div className="filter-select-wrap">
            <select value={toYear} onChange={(e) => setToYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={generating}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
