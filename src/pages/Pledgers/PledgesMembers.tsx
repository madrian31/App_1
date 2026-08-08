import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembers from "../../hooks/useMembers";
import PageHeader from "../../components/members/PageHeader";
import MembersToolbar from "../../components/members/MembersToolbar";
import MembersTable from "../../components/members/MembersTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import "../Members/members.css";

export default function PledgesMembers() {
  const {
    loading,
    members,
    activeCount,
    filteredCount,
    search,
    pageSize,
    currentPage,
    totalPages,
    start,
    toast,
    onSearchChange,
    onPageSizeChange,
    goFirst,
    goPrev,
    goNext,
    goLast,
    archiveMember,
    togglePledger,
  } = useMembers({ pledgersOnly: true });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          {/* Walang "Add Member" button dito — ang pagiging pledger ay
             itinatakda mula sa Members table (toggle-pledger button). */}
          <PageHeader title="Pledges" count={activeCount} countLabel="pledger" />

          <MembersToolbar search={search} onSearchChange={onSearchChange} hideFilter />

          <div className="members-card">
            <MembersTable
              members={members}
              loading={loading}
              onArchive={archiveMember}
              onTogglePledger={togglePledger}
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
