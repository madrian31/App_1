import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import usePledgersMembers from "../../hooks/usePledgersMembers";
import PageHeader from "../../components/members/PageHeader";
import MembersToolbar from "../../components/members/MembersToolbar";
import MembersTable from "../../components/members/MembersTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import AddPledgersModal from "../../components/pledges/AddPledgersModal";
import "./pledgesMembers.css";

export default function PledgesMembers() {
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    loading,
    allMembers,
    members,
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
    togglePledger,
    archiveMember,
  } = usePledgersMembers();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader
            title="Pledgers"
            count={activeCount}
            countLabel="pledger"
            onAddMember={() => setShowAddModal(true)}
            addButtonLabel="Add Members"
          />

          <MembersToolbar
            search={search}
            onSearchChange={onSearchChange}
            filter={filter}
            onFilterChange={onFilterChange}
          />

          <div className="members-card">
            <MembersTable
              members={members}
              loading={loading}
              onArchive={archiveMember}
              onTogglePledger={togglePledger}
              showPledgerColumn
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

          {showAddModal && (
            <AddPledgersModal
              members={allMembers}
              onToggle={togglePledger}
              onClose={() => setShowAddModal(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}