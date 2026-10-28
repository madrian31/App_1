import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembers, { ALL_CATEGORIES, UNCATEGORIZED } from "../../hooks/useMembers";
import { YOUTH, isYouthCategory, youthSubLabel } from "../../types/member";
import PageHeader from "../../components/members/PageHeader";
import MembersToolbar, { type FilterOption } from "../../components/members/MembersToolbar";
import MembersTable from "../../components/members/MembersTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import ImportExportBar from "../../components/members/ImportExportBar";
import { useCurrentUserName } from "../../auth/authContext";
import "./members.css";

export default function Members() {
  const currentUser = useCurrentUserName();
  const navigate = useNavigate();
  const {
    loading,
    members,
    filteredMembers,
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

  // "Youth Boys" and "Youth Girls" share one "Youth" choice; a second dropdown
  // then narrows it to Boys or Girls.
  const youthCategories = categories.filter(isYouthCategory);
  const departmentOptions = [
    ...categories.filter((c) => !isYouthCategory(c)).map((c) => ({ value: c, label: c })),
    ...(youthCategories.length ? [{ value: YOUTH, label: "Youth" }] : []),
  ].sort((a, b) => a.label.localeCompare(b.label));

  const categoryFilterOptions: FilterOption<string>[] = [
    { value: ALL_CATEGORIES, label: "All Departments" },
    ...departmentOptions,
    ...(hasUncategorized ? [{ value: UNCATEGORIZED, label: "Uncategorized" }] : []),
  ];

  const youthSelected = filter === YOUTH || isYouthCategory(filter);
  const youthSubFilter = youthSelected
    ? {
        value: filter,
        options: [
          { value: YOUTH, label: "Boys & Girls" },
          ...youthCategories.map((c) => ({ value: c, label: youthSubLabel(c) })),
        ],
        onChange: onFilterChange,
      }
    : undefined;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader
            title="Members"
            count={activeCount}
            onAddMember={() => navigate("/Profile/new")}
            extraActions={<ImportExportBar currentUser={currentUser} onImported={refetch} pdfMembers={filteredMembers} />}
          />

          <MembersToolbar
            search={search}
            onSearchChange={onSearchChange}
            filter={youthSelected ? YOUTH : filter}
            onFilterChange={onFilterChange}
            filterOptions={categoryFilterOptions}
            subFilter={youthSubFilter}
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