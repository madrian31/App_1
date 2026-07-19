interface PaginationProps {
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  currentPage: number;
  totalPages: number;
  start: number;
  filteredCount: number;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
}

export default function Pagination({
  pageSize,
  onPageSizeChange,
  currentPage,
  totalPages,
  start,
  filteredCount,
  onFirst,
  onPrev,
  onNext,
  onLast,
}: PaginationProps) {
  const showingText =
    filteredCount === 0
      ? "Showing 0 of 0 members"
      : `Showing ${start + 1}–${Math.min(start + pageSize, filteredCount)} of ${filteredCount} member${
          filteredCount !== 1 ? "s" : ""
        }`;

  return (
    <div className="table-footer">
      <div className="footer-left">
        <div className="page-size-wrap">
          <span className="page-size-label">Rows</span>
          <select
            className="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </div>
        <span>{showingText}</span>
      </div>

      <div className="page-nav">
        <button className="page-btn" title="First page" onClick={onFirst} disabled={currentPage === 1}>
          <i className="fa-solid fa-angles-left" />
        </button>
        <button className="page-btn" title="Previous page" onClick={onPrev} disabled={currentPage === 1}>
          <i className="fa-solid fa-angle-left" />
        </button>
        <span className="page-indicator">
          {currentPage} / {totalPages}
        </span>
        <button className="page-btn" title="Next page" onClick={onNext} disabled={currentPage === totalPages}>
          <i className="fa-solid fa-angle-right" />
        </button>
        <button className="page-btn" title="Last page" onClick={onLast} disabled={currentPage === totalPages}>
          <i className="fa-solid fa-angles-right" />
        </button>
      </div>
    </div>
  );
}
