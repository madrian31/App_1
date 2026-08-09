import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useVisitation from "../../hooks/useVisitation";
import PageHeader from "../../components/members/PageHeader";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import VisitSummaryCards from "../../components/visitation/VisitSummaryCards";
import VisitationToolbar from "../../components/visitation/VisitationToolbar";
import VisitationTable from "../../components/visitation/VisitationTable";
import VisitDetailsModal from "../../components/visitation/VisitDetailsModal";
import type { Visit } from "../../types/visit";
import "./visitation.css";

export default function Visitation() {
  const navigate = useNavigate();
  const [viewingVisit, setViewingVisit] = useState<Visit | null>(null);

  const {
    loading,
    visits,
    filteredCount,
    totalVisits,
    uniqueMembers,
    search,
    onSearchChange,
    department,
    onDepartmentChange,
    quickRange,
    onQuickRangeChange,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onApplyFilter,
    onResetFilter,
    pageSize,
    currentPage,
    totalPages,
    start,
    onPageSizeChange,
    goFirst,
    goPrev,
    goNext,
    goLast,
    toast,
    deleteVisit,
  } = useVisitation();

  function handleDelete(id: string) {
    if (!window.confirm("Delete this visit record? This cannot be undone.")) return;
    deleteVisit(id);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader
            title="Visitation"
            count={totalVisits}
            countLabel="visit"
            onAddMember={() => navigate("/Visitation/new")}
            addButtonLabel="Record Visit"
            extraActions={
              <button className="btn-secondary" onClick={() => navigate("/Visitation/Reports")}>
                <i className="fa-solid fa-chart-column" aria-hidden="true" />
                Reports
              </button>
            }
          />

          <VisitSummaryCards totalVisits={totalVisits} uniqueMembers={uniqueMembers} />

          <VisitationToolbar
            search={search}
            onSearchChange={onSearchChange}
            department={department}
            onDepartmentChange={onDepartmentChange}
            quickRange={quickRange}
            onQuickRangeChange={onQuickRangeChange}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={onDateFromChange}
            onDateToChange={onDateToChange}
            onApplyFilter={onApplyFilter}
            onResetFilter={onResetFilter}
          />

          <div className="members-card">
            <VisitationTable
              visits={visits}
              loading={loading}
              onView={setViewingVisit}
              onEdit={(v) => navigate(`/Visitation/${v.id}`)}
              onDelete={handleDelete}
            />
            <Pagination
              pageSize={pageSize}
              onPageSizeChange={onPageSizeChange}
              currentPage={currentPage}
              totalPages={totalPages}
              start={start}
              filteredCount={filteredCount}
              onFirst={goFirst}
              onPrev={goPrev}
              onNext={goNext}
              onLast={goLast}
            />
          </div>

          <Toast message={toast} />

          {viewingVisit && (
            <VisitDetailsModal visit={viewingVisit} onClose={() => setViewingVisit(null)} />
          )}
        </div>
      </main>
    </div>
  );
}