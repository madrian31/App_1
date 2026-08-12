import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useSundaySchoolRoster from "../../hooks/useSundaySchoolRoster";
import PageHeader from "../../components/members/PageHeader";
import SundaySchoolRosterToolbar from "../../components/sundaySchool/SundaySchoolRosterToolbar";
import SundaySchoolRosterTable from "../../components/sundaySchool/SundaySchoolRosterTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import "./sundaySchool.css";

export default function SundaySchoolKidsMembers() {
  const navigate = useNavigate();
  const {
    loading,
    children,
    activeCount,
    filteredCount,
    search,
    onSearchChange,
    filter,
    onFilterChange,
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
    toggleActive,
  } = useSundaySchoolRoster();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader
            title="Sunday School Kids"
            count={activeCount}
            countLabel="active child"
            onAddMember={() => navigate("/SundaySchool/SundaySchoolKidsMembers/new")}
            addButtonLabel="Add Child"
          />

          <SundaySchoolRosterToolbar
            search={search}
            onSearchChange={onSearchChange}
            filter={filter}
            onFilterChange={onFilterChange}
          />

          <div className="members-card">
            <SundaySchoolRosterTable children={children} loading={loading} onToggleActive={toggleActive} />
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
        </div>
      </main>
    </div>
  );
}
