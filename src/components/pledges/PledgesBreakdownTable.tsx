import { MONTHS, MONTHS_SHORT, type MemberReportRow } from "../../hooks/usePledgesReport";
import { fmtPeso } from "../finance/financeFormat";

interface PledgesBreakdownTableProps {
  rows: MemberReportRow[];
  month: number | null; // null = All Months
  year: number;
  sundaysPerMonth: string[][]; // Sundays of each month, Jan..Dec
  periodSundays: string[]; // Sundays of the selected month
  totalCollected: number;
  periodLabel: string;
}

function sundayLabel(iso: string, style: "short" | "long" = "short"): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", {
    month: style,
    day: "numeric",
    ...(style === "long" ? { year: "numeric" } : {}),
  });
}

/**
 * Who gave, and when. All Months: one column per month, with how many Sundays were
 * paid ("4/5"). One month: one column per Sunday, so each collection is visible.
 */
export default function PledgesBreakdownTable({
  rows,
  month,
  year,
  sundaysPerMonth,
  periodSundays,
  totalCollected,
  periodLabel,
}: PledgesBreakdownTableProps) {
  const allMonths = month === null;
  const columns = allMonths
    ? MONTHS_SHORT.map((label, m) => ({ key: String(m), label, title: `${MONTHS[m]} ${year}` }))
    : periodSundays.map((d) => ({ key: d, label: sundayLabel(d), title: `Sunday, ${sundayLabel(d, "long")}` }));

  const amountAt = (r: MemberReportRow, i: number) =>
    allMonths ? r.monthTotals[i] : r.bySunday[periodSundays[i]]?.amount || 0;
  const columnTotals = columns.map((_, i) => rows.reduce((s, r) => s + amountAt(r, i), 0));

  return (
    <div className="members-card">
      <div className="pledge-breakdown-header">
        <h3>Member Breakdown — {periodLabel}</h3>
        <span className="trend-hint">
          {allMonths
            ? "Amount per month · 4/5 means they gave on 4 of the 5 Sundays"
            : "Amount per Sunday, with its note"}
        </span>
      </div>

      <div className="table-scroll">
        <table className="members-table pledge-breakdown-table">
          <thead>
            <tr>
              <th>Member</th>
              {columns.map((c) => (
                <th key={c.key} className="pledge-num" title={c.title}>
                  {c.label}
                </th>
              ))}
              <th className="pledge-num pledge-total-col">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="table-empty">
                  No pledgers yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.memberId}>
                  <td>
                    <span className="member-name">{r.memberName}</span>
                  </td>
                  {columns.map((c, i) => {
                    const amount = amountAt(r, i);
                    if (amount <= 0) {
                      return (
                        <td key={c.key} className="pledge-num pledge-none">
                          —
                        </td>
                      );
                    }
                    if (allMonths) {
                      const paid = r.sundaysPaid[i];
                      const of = sundaysPerMonth[i].length;
                      return (
                        <td key={c.key} className="pledge-num">
                          {fmtPeso(amount)}
                          <span
                            className={`pledge-sundays${paid >= of ? " complete" : ""}`}
                            title={`Gave on ${paid} of ${of} Sundays`}
                          >
                            {paid}/{of}
                          </span>
                        </td>
                      );
                    }
                    const notes = r.bySunday[c.key]?.notes;
                    return (
                      <td key={c.key} className="pledge-num" title={notes || undefined}>
                        {fmtPeso(amount)}
                        {notes && <span className="pledge-note">{notes}</span>}
                      </td>
                    );
                  })}
                  <td className="pledge-num pledge-total-col">{r.periodTotal > 0 ? fmtPeso(r.periodTotal) : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr>
                <td>Total</td>
                {columnTotals.map((t, i) => (
                  <td key={columns[i].key} className="pledge-num">
                    {t > 0 ? fmtPeso(t) : "—"}
                  </td>
                ))}
                <td className="pledge-num pledge-total-col">{fmtPeso(totalCollected)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
