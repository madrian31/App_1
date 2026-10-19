import type { RowSaveStatus, ServiceDay } from "../../hooks/useOfferings";
import { formatDisplayDate } from "../../utils/date";
import { fmtPeso } from "../finance/financeFormat";

interface OfferingsTableProps {
  days: ServiceDay[];
  entries: Record<string, { amount?: string }>; // keyed by ISO date
  rowStatus: Record<string, RowSaveStatus | undefined>;
  loading: boolean;
  canManage: boolean;
  monthLabel: string;
  total: number;
  onAmountChange: (day: ServiceDay, value: string) => void;
  onBlur: (day: ServiceDay) => void;
}

function SaveBadge({ status }: { status?: RowSaveStatus }) {
  if (!status) return null;
  const config: Record<RowSaveStatus, { label: string; color: string }> = {
    saving: { label: "Saving…", color: "var(--text-muted)" },
    saved: { label: "✓ Saved", color: "var(--success)" },
    error: { label: "⚠ Failed", color: "var(--danger)" },
  };
  const { label, color } = config[status];
  return <span style={{ fontSize: 12, color, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>;
}

export default function OfferingsTable({
  days,
  entries,
  rowStatus,
  loading,
  canManage,
  monthLabel,
  total,
  onAmountChange,
  onBlur,
}: OfferingsTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table offering-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Service</th>
            <th>Offering</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={4} className="empty-cell">
                <div className="empty-state">
                  <p>Loading offerings…</p>
                </div>
              </td>
            </tr>
          ) : (
            days.map((day) => {
              const amount = entries[day.date]?.amount ?? "";
              const recorded = (parseFloat(amount) || 0) > 0;
              return (
                <tr key={day.date} className={day.isFuture ? "offering-row-future" : recorded ? "offering-row-recorded" : undefined}>
                  <td>
                    <span className="offering-date">{formatDisplayDate(day.date)}</span>
                  </td>
                  <td>
                    <span className={`badge offering-service offering-service--${day.service.toLowerCase()}`}>
                      <i
                        className={`fa-solid ${day.service === "Sunday" ? "fa-church" : "fa-book-bible"}`}
                        aria-hidden="true"
                      />{" "}
                      {day.service === "Sunday" ? "Sunday Service" : "Wednesday Service"}
                    </span>
                  </td>
                  <td>
                    {day.isFuture ? (
                      <span className="offering-upcoming">Upcoming</span>
                    ) : (
                      <div className="offering-amount-wrap">
                        ₱
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          value={amount}
                          disabled={!canManage}
                          aria-label={`Offering for ${formatDisplayDate(day.date)}`}
                          onChange={(e) => onAmountChange(day, e.target.value)}
                          onBlur={() => onBlur(day)}
                          className="offering-input"
                        />
                      </div>
                    )}
                  </td>
                  <td>
                    <SaveBadge status={rowStatus[day.date]} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
        {!loading && (
          <tfoot>
            <tr>
              <td colSpan={2} style={{ fontWeight: 600, color: "var(--text-muted)" }}>
                Total — {monthLabel}
              </td>
              <td style={{ fontWeight: 700, color: "var(--success)" }}>{fmtPeso(total)}</td>
              <td></td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
