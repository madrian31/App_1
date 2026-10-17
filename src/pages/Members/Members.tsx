import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembers, { ALL_CATEGORIES, UNCATEGORIZED } from "../../hooks/useMembers";
import PageHeader from "../../components/members/PageHeader";
import MembersToolbar, { type FilterOption } from "../../components/members/MembersToolbar";
import MembersTable from "../../components/members/MembersTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import ImportExportBar from "../../components/members/ImportExportBar";
import "./members.css";

// TODO: replace with the actual logged-in user once auth/session wiring is in place.
const CURRENT_USER = "Unknown";

export default function Members() {
  const navigate = useNavigate();
  const {
    loading,
    members,
    activeCount,
    filteredCount,
    search,
    filter,
    categories,
    hasUncategorized,
    pageSize,
    currentPage,
    totalPages,
    start,
    toast,
    onSearchChange,
    onFilterChange,
    onPageSizeChange,
    goFirst,
    goPrev,
    goNext,
    goLast,
    archiveMember,
    refetch,
  } = useMembers();

  const categoryFilterOptions: FilterOption<string>[] = [
    { value: ALL_CATEGORIES, label: "All Departments" },
    ...categories.map((c) => ({ value: c, label: c })),
    ...(hasUncategorized ? [{ value: UNCATEGORIZED, label: "Uncategorized" }] : []),
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader
            title="Members"
            count={activeCount}
            onAddMember={() => navigate("/Profile/new")}
            extraActions={<ImportExportBar currentUser={CURRENT_USER} onImported={refetch} />}
          />

          <MembersToolbar
            search={search}
            onSearchChange={onSearchChange}
            filter={filter}
            onFilterChange={onFilterChange}
            filterOptions={categoryFilterOptions}
          />

          <div className="members-card">
            <MembersTable
              members={members}
              loading={loading}
              onArchive={archiveMember}
              showPledgerColumn={false}
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
        </div>
      </main>
    </div>
  );
}