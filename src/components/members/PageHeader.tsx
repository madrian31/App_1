interface PageHeaderProps {
  title: string;
  count: number;
  countLabel?: string; // e.g. "member" or "pledger"
  onAddMember?: () => void;
  addButtonLabel?: string;
}

export default function PageHeader({
  title,
  count,
  countLabel = "member",
  onAddMember,
  addButtonLabel = "Add Member",
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
      {onAddMember && (
        <button className="btn-add" onClick={onAddMember}>
          <i className="fa-solid fa-user-plus" aria-hidden="true" />
          {addButtonLabel}
        </button>
      )}
    </div>
  );
}
