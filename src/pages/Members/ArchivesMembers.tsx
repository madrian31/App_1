import { Sidebar } from "../../components/sidebar/Sidebar";
import useArchivedMembers from "../../hooks/useArchivedMembers";
import PageHeader from "../../components/members/PageHeader";
import MembersToolbar from "../../components/members/MembersToolbar";
import ArchivedMembersTable from "../../components/members/ArchivedMembersTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import "./members.css";

export default function ArchivesMembers() {
  const {
    loading,
    members,
    archivedCount,
    filteredCount,
    search,
    onSearchChange,
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
    unarchiveMember,
  } = useArchivedMembers();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader title="Archived Members" count={archivedCount} countLabel="archived member" />

          <MembersToolbar search={search} onSearchChange={onSearchChange} hideFilter />

          <div className="members-card">
            <ArchivedMembersTable members={members} loading={loading} onUnarchive={unarchiveMember} />
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
