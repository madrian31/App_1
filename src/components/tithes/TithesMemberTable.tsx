import type { RowSaveStatus } from "../../hooks/useTithesByMember";
import type { Member } from "../../types/member";

interface Entry {
  amount?: string;
  notes?: string;
}

interface TithesMemberTableProps {
  members: Member[];
  entries: Record<string, Entry>; // keyed by memberId
  rowStatus: Record<string, RowSaveStatus | undefined>;
  loading: boolean;
  canManage: boolean;
  onAmountChange: (member: Member, value: string) => void;
  onNotesChange: (member: Member, value: string) => void;
  onBlur: (member: Member) => void;
}

function SaveBadge({ status }: { status?: RowSaveStatus }) {
  if (!status) return null;
  const config: Record<RowSaveStatus, { label: string; color: string }> = {
    saving: { label: "Saving…", color: "var(--text-muted)" },
    saved: { label: "✓ Saved", color: "var(--success)" },
    error: { label: "⚠ Failed", color: "var(--danger)" },
  };
  const { label, color } = config[status];
  return <span style={{ fontSize: 11, color, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>;
}

export default function TithesMemberTable({
  members,
  entries,
  rowStatus,
  loading,
  canManage,
  onAmountChange,
  onNotesChange,
  onBlur,
}: TithesMemberTableProps) {
  return (
    <div className="table-scroll">
      <table className="members-table tithe-member-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Amount</th>
            <th className="col-hide-mobile">Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="empty-cell">
                <div className="empty-state">
                  <p>Loading members…</p>
                </div>
              </td>
            </tr>
          ) : members.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-cell">
                <div className="empty-state">
                  <i className="fa-regular fa-folder-open" />
                  <p>No members match.</p>
                </div>
              </td>
            </tr>
          ) : (
            members.map((m, i) => {
              const entry = entries[m.id] || {};
              const given = (parseFloat(entry.amount || "0") || 0) > 0;
              return (
                <tr key={m.id} className={given ? "tithe-row-given" : undefined}>
                  <td>{i + 1}</td>
                  <td>
                    {m.lastName}, {m.firstName}
                    {m.middleInitial ? ` ${m.middleInitial}.` : ""}
                  </td>
                  <td>
                    <div className="tithe-amount-wrap">
                      ₱
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={entry.amount || ""}
                        disabled={!canManage}
                        onChange={(e) => onAmountChange(m, e.target.value)}
                        onBlur={() => onBlur(m)}
                        className="tithe-inline-input tithe-inline-input--amount"
                      />
                    </div>
                  </td>
                  <td className="col-hide-mobile">
                    <input
                      type="text"
                      placeholder="Add note…"
                      value={entry.notes || ""}
                      disabled={!canManage || !given}
                      onChange={(e) => onNotesChange(m, e.target.value)}
                      onBlur={() => onBlur(m)}
                      className="tithe-inline-input tithe-inline-input--notes"
                    />
                  </td>
                  <td>
                    <SaveBadge status={rowStatus[m.id]} />
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
