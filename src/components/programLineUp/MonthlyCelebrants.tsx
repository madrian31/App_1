import type { MonthlyCelebrant } from "../../types/member";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthlyCelebrantsProps {
  celebrants: MonthlyCelebrant[];
  month: number; // 0-indexed
  
}

export default function MonthlyCelebrants({ celebrants, month }: MonthlyCelebrantsProps) {
  return (
    <div className="lineup-card celebrants-card">
      <div className="celebrants-header">
        <i className="fa-solid fa-cake-candles" aria-hidden="true" />
        {MONTHS[month]} Birthdays &amp; Anniversaries
      </div>
      {celebrants.length === 0 ? (
        <p className="pledger-checklist-empty">No birthdays or anniversaries this month.</p>
      ) : (
        <div className="celebrants-list">
          {celebrants.map((c, i) => (
            <div className="celebrants-item" key={`${c.memberId}-${c.type}-${i}`}>
              <span className="celebrants-day">{c.day}</span>
              <span className="celebrants-name">{c.name}</span>
              <span className={`badge celebrants-type-${c.type}`}>
                {c.type === "birthday" ? "Birthday" : "Anniversary"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
