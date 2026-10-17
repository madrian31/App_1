export interface FilterOption<T extends string> {
    value: T;
    label: string;
}

const PLEDGER_FILTER_OPTIONS: FilterOption<string>[] = [
    { value: "all", label: "All Members" },
    { value: "yes", label: "Pledgers Only" },
    { value: "no", label: "Non-Pledgers" },
];

interface MembersToolbarProps<T extends string> {
    search: string;
    onSearchChange: (value: string) => void;
    filter?: T;
    onFilterChange?: (value: T) => void;
    /** Dropdown choices. Defaults to the pledger filter (All / Pledgers / Non-Pledgers). */
    filterOptions?: FilterOption<T>[];
    /** Hide the filter dropdown — used on pages that are already filtered (e.g. Archives). */
    hideFilter?: boolean;
}

export default function MembersToolbar<T extends string>({
    search,
    onSearchChange,
    filter,
    onFilterChange,
    filterOptions = PLEDGER_FILTER_OPTIONS as FilterOption<T>[],
    hideFilter = false,
}: MembersToolbarProps<T>) {
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
                        value={filter ?? filterOptions[0]?.value}
                        onChange={(e) =>
                            onFilterChange(
                                e.target.value as T
                            )
                        }
                    >
                        {filterOptions.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
