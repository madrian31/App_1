import type { RowSaveStatus } from "../../hooks/usePledgeTracker";

interface Entry {
  amount?: string;
  notes?: string;
}

interface PledgeTrackerTableProps {
  sundays: string[]; // ISO date strings
  entries: Record<string, Entry>;
  rowStatus: Record<string, RowSaveStatus | undefined>;
  loading: boolean;
  disabled: boolean; // true when no member is selected yet
  onAmountChange: (date: string, value: string) => void;
  onNotesChange: (date: string, value: string) => void;
  onCommitAmount: (date: string, value: string) => void;
  onCommitNotes: (date: string, value: string) => void;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function SaveBadge({ status }: { status?: RowSaveStatus }) {
  if (!status) return null;
  const config: Record<RowSaveStatus, { label: string; color: string }> = {
    saving: { label: "Saving…", color: "var(--text-muted)" },
    saved: { label: "✓ Saved", color: "var(--success)" },
    error: { label: "⚠ Failed", color: "var(--danger)" },
  };
  const { label, color } = config[status];
  return <span style={{ fontSize: 11, marginLeft: 8, color, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>;
}

export default function PledgeTrackerTable({
  sundays,
  entries,
  rowStatus,
  loading,
  disabled,
  onAmountChange,
  onNotesChange,
  onCommitAmount,
  onCommitNotes,
}: PledgeTrackerTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {disabled ? (
            <tr>
              <td colSpan={5} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-hand-holding-heart" />
                  <p>Select a pledger above to record their Sundays.</p>
                </div>
              </td>
            </tr>
          ) : loading ? (
            <tr>
              <td colSpan={5} className="empty-cell">
                <div className="empty-state">
                  <p>Loading pledges…</p>
                </div>
              </td>
            </tr>
          ) : (
            sundays.map((date, i) => {
              const entry = entries[date] || {};
              const paid = parseFloat(entry.amount || "0") > 0;
              const status = rowStatus[date];

              return (
                <tr key={date}>
                  <td>{i + 1}</td>
                  <td>
                    <span className="date-text">{formatDisplayDate(date)}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      ₱
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={entry.amount || ""}
                        onChange={(e) => onAmountChange(date, e.target.value)}
                        onBlur={(e) => onCommitAmount(date, e.target.value)}
                        style={{
                          width: 110,
                          padding: "6px 8px",
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          textAlign: "right",
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={
                        paid
                          ? { background: "#ecfdf5", color: "var(--success)", border: "1px solid #a7f3d0" }
                          : { background: "var(--danger-bg)", color: "var(--danger)", border: "1px solid #f5c2c4" }
                      }
                    >
                      {paid ? "Collected" : "Uncollected"}
                    </span>
                    <SaveBadge status={status} />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="Add note…"
                      value={entry.notes || ""}
                      onChange={(e) => onNotesChange(date, e.target.value)}
                      onBlur={(e) => onCommitNotes(date, e.target.value)}
                      style={{
                        width: "100%",
                        minWidth: 160,
                        padding: "6px 8px",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                      }}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
