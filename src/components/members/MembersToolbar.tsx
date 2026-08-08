import type { PledgerFilter } from "../../hooks/useMembers";

interface MembersToolbarProps {
    search: string;
    onSearchChange: (value: string) => void;
    filter?: PledgerFilter;
    onFilterChange?: (value: PledgerFilter) => void;
    /** Hide the pledger filter dropdown — used on the Pledges page, which is already filtered. */
    hideFilter?: boolean;
}

export default function MembersToolbar({
    search,
    onSearchChange,
    filter = "all",
    onFilterChange,
    hideFilter = false,
}: MembersToolbarProps) {
    return (
        <div className="toolbar">
            <div className="search-wrap">
                <i
                    className="fa-solid fa-magnifying-glass"
                    aria-hidden="true"
                />

                <input
                    type="text"
                    placeholder="Search by name…"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {!hideFilter && onFilterChange && (
                <div className="filter-select-wrap">
                    <i
                        className="fa-solid fa-filter"
                        aria-hidden="true"
                    />

                    <select
                        value={filter}
                        onChange={(e) =>
                            onFilterChange(
                                e.target.value as PledgerFilter
                            )
                        }
                    >
                        <option value="all">All Members</option>
                        <option value="yes">Pledgers Only</option>
                        <option value="no">Non-Pledgers</option>
                    </select>
                </div>
            )}
        </div>
    );
}
