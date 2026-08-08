import { useNavigate } from "react-router-dom";
import { initials } from "../../hooks/useMembers";
import type { Member } from "../../types/member";

interface MembersTableProps {
    members: Member[];
    loading: boolean;
    onArchive: (id: string) => void;
    onTogglePledger: (id: string) => void;
}

export default function MembersTable({
    members,
    loading,
    onArchive,
    onTogglePledger,
}: MembersTableProps) {
    const navigate = useNavigate();

    return (
        <div className="table-wrap">
            <table className="members-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Pledger</th>
                        <th>Added By</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="table-empty">
                                Loading members…
                            </td>
                        </tr>
                    ) : members.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="table-empty">
                                No members found.
                            </td>
                        </tr>
                    ) : (
                        members.map((m) => (
                            <tr key={m.id}>
                                <td>
                                    <div className="member-cell">
                                        <div className="avatar">
                                            {initials(m)}
                                        </div>

                                        <div className="member-info">
                                            <div className="member-name">
                                                {m.firstName}
                                                {m.middleName
                                                    ? ` ${m.middleName}`
                                                    : ""}{" "}
                                                {m.lastName}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <button
                                        className={`toggle-pledger${
                                            m.isPledger ? " active" : ""
                                        }`}
                                        onClick={() =>
                                            onTogglePledger(m.id)
                                        }
                                        title={
                                            m.isPledger
                                                ? "Remove as pledger"
                                                : "Mark as pledger"
                                        }
                                    >
                                        <i
                                            className={`fa-solid ${
                                                m.isPledger
                                                    ? "fa-check"
                                                    : "fa-hand-holding-heart"
                                            }`}
                                        />

                                        {m.isPledger
                                            ? "Pledger"
                                            : "Mark"}
                                    </button>
                                </td>

                                <td>
                                    <span className="added-by">
                                        <i
                                            className="fa-regular fa-user"
                                            style={{ fontSize: 12 }}
                                        />
                                        {m.addedBy}
                                    </span>
                                </td>

                                <td>
                                    <span className="date-text">
                                        {m.dateAdded}
                                    </span>
                                </td>

                                <td>
                                    <div className="actions-cell">
                                        <button
                                            className="btn-icon"
                                            title="Edit"
                                            onClick={() =>
                                                navigate(
                                                    `/Profile/${m.id}`
                                                )
                                            }
                                        >
                                            <i className="fa-regular fa-pen-to-square" />
                                        </button>

                                        <button
                                            className="btn-icon danger"
                                            title="Archive"
                                            onClick={() =>
                                                onArchive(m.id)
                                            }
                                        >
                                            <i className="fa-solid fa-box-archive" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
