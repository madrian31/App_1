interface MembersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function MembersToolbar({ search, onSearchChange }: MembersToolbarProps) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
