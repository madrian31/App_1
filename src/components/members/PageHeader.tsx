import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  count: number;
  countLabel?: string; // e.g. "member" or "pledger"
  onAddMember?: () => void;
  addButtonLabel?: string;
  /** Extra action buttons rendered before the Add button (e.g. Import/Export). */
  extraActions?: ReactNode;
}

export default function PageHeader({
  title,
  count,
  countLabel = "member",
  onAddMember,
  addButtonLabel = "Add Member",
  extraActions,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <h1>{title}</h1>
        <p>
          {count} {countLabel}
          {count !== 1 ? "s" : ""} total
        </p>
      </div>
      <div className="page-header-actions">
        {extraActions}
        {onAddMember && (
          <button className="btn-add" onClick={onAddMember}>
            <i className="fa-solid fa-user-plus" aria-hidden="true" />
            {addButtonLabel}
          </button>
        )}
      </div>
    </div>
  );
}