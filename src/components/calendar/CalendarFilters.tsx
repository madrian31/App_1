import { useEffect, useState } from "react";
import {
  findCategory,
  type CalendarCategoryItem,
  type DateFilterKey,
  type FilterChip,
} from "../../types/calendarEvent";

interface DateFilterOption {
  key: DateFilterKey;
  label: string;
}

interface Props {
  categories: CalendarCategoryItem[];
  searchQuery: string;
  onSearchChange: (v: string) => void;

  activeCats: Set<string>;
  onActiveCatsChange: (cats: Set<string>) => void;
  dateFilter: DateFilterKey;
  onDateFilterChange: (v: DateFilterKey) => void;
  customFrom: string;
  onCustomFromChange: (v: string) => void;
  customTo: string;
  onCustomToChange: (v: string) => void;
  dateFilterOptions: DateFilterOption[];

  chips: FilterChip[];
  onRemoveChip: (chip: FilterChip) => void;
  onResetAll: () => void;
  onManageCategories: () => void;
}

export default function CalendarFilters({
  categories,
  searchQuery,
  onSearchChange,
  activeCats,
  onActiveCatsChange,
  dateFilter,
  onDateFilterChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  dateFilterOptions,
  chips,
  onRemoveChip,
  onResetAll,
  onManageCategories,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draftCats, setDraftCats] = useState(activeCats);
  const [draftDateFilter, setDraftDateFilter] = useState(dateFilter);
  const [draftFrom, setDraftFrom] = useState(customFrom);
  const [draftTo, setDraftTo] = useState(customTo);

  useEffect(() => {
    if (open) {
      setDraftCats(new Set(activeCats));
      setDraftDateFilter(dateFilter);
      setDraftFrom(customFrom);
      setDraftTo(customTo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleDraftCat(id: string) {
    setDraftCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function apply() {
    onActiveCatsChange(draftCats.size > 0 ? draftCats : new Set(categories.map((c) => c.id)));
    onDateFilterChange(draftDateFilter);
    onCustomFromChange(draftFrom);
    onCustomToChange(draftTo);
    setOpen(false);
  }

  function clearDraft() {
    setDraftCats(new Set(categories.map((c) => c.id)));
    setDraftDateFilter("all");
    setDraftFrom("");
    setDraftTo("");
  }

  function chipLabel(chip: FilterChip): string {
    if (chip.type === "search") return `Search: "${searchQuery}"`;
    if (chip.type === "cat") return findCategory(categories, chip.key).label;
    if (chip.type === "date") {
      if (dateFilter === "custom" && (customFrom || customTo)) {
        return `Range: ${customFrom || "…"} – ${customTo || "…"}`;
      }
      const opt = dateFilterOptions.find((o) => o.key === dateFilter);
      return opt ? opt.label : dateFilter;
    }
    return "";
  }

  return (
    <>
      <div className="toolbar">
        <div className={`search-wrap${searchQuery ? " has-value" : ""}`}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input
            type="text"
            className="search-input"
            placeholder="Search events, activities, birthdays..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onSearchChange("")}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="filters-btn-wrap">
          <button
            type="button"
            className={`filters-btn${chips.length > 0 ? " has-active" : ""}`}
            onClick={() => setOpen((o) => !o)}
          >
            <i className="fa-solid fa-sliders" aria-hidden="true" />
            <span className="label">Filters</span>
            {chips.length > 0 && <span className="filters-badge">{chips.length}</span>}
          </button>

          {open && (
            <div className="filters-panel open" onClick={(e) => e.stopPropagation()}>
              <div className="filters-panel-section">
                <div className="filters-panel-title-row">
                  <div className="filters-panel-title">
                    <i className="fa-solid fa-tag" aria-hidden="true" /> Category
                  </div>
                  <button
                    type="button"
                    className="manage-categories-link"
                    onClick={() => {
                      setOpen(false);
                      onManageCategories();
                    }}
                  >
                    Manage
                  </button>
                </div>
                {categories.length === 0 && <p className="cat-empty-hint">No categories yet.</p>}
                {categories.map((cat) => (
                  <label className="cat-check-row" key={cat.id}>
                    <input type="checkbox" checked={draftCats.has(cat.id)} onChange={() => toggleDraftCat(cat.id)} />
                    <i className={cat.icon} style={{ color: cat.color, width: 14 }} aria-hidden="true" />
                    <span className="label">{cat.label}</span>
                    <span className="dot" style={{ background: cat.color }} />
                  </label>
                ))}
              </div>

              <div className="filters-panel-section">
                <div className="filters-panel-title">
                  <i className="fa-regular fa-calendar" aria-hidden="true" /> Date
                </div>
                {dateFilterOptions.map((df) => (
                  <div key={df.key}>
                    <label className="date-radio-row">
                      <input
                        type="radio"
                        name="dateFilter"
                        checked={draftDateFilter === df.key}
                        onChange={() => setDraftDateFilter(df.key)}
                      />
                      <span>{df.label}</span>
                    </label>
                    {df.key === "custom" && draftDateFilter === "custom" && (
                      <div className="custom-range">
                        <input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
                        <input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="filters-panel-footer">
                <button type="button" className="btn-ghost" onClick={clearDraft}>
                  Clear All
                </button>
                <button type="button" className="btn-primary" onClick={apply}>
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="active-filters-row">
          {chips.map((chip, idx) => (
            <span className="active-chip" key={idx}>
              {chipLabel(chip)}
              <button type="button" aria-label="Remove filter" onClick={() => onRemoveChip(chip)}>
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button type="button" className="clear-all-link" onClick={onResetAll}>
            Clear all
          </button>
        </div>
      )}
    </>
  );
}