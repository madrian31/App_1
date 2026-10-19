import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useVisitors from "../../hooks/useVisitors";
import PageHeader from "../../components/members/PageHeader";
import MembersToolbar from "../../components/members/MembersToolbar";
import VisitorsTable from "../../components/members/VisitorsTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import "./members.css";

export default function VisitorsMembers() {
  const navigate = useNavigate();
  const {
    loading,
    visitors,
    visitorCount,
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
    busyId,
    removeConfirmId,
    setRemoveConfirmId,
    makeMember,
    removeVisitor,
  } = useVisitors();

  // Becoming a member: open their profile right away to fill in birthday, category, ministry…
  async function handleMakeMember(id: string) {
    if (await makeMember(id)) navigate(`/Profile/${id}`);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader title="Visitors" count={visitorCount} countLabel="visitor" />

          <p className="visitors-help">
            <i className="fa-solid fa-circle-info" aria-hidden="true" /> Visitors are people from the attendance who
            aren't in the members directory yet. Click <strong>Make Member</strong> to add them as a member and complete
            their profile.
          </p>

          <MembersToolbar search={search} onSearchChange={onSearchChange} hideFilter />

          <div className="members-card">
            <VisitorsTable
              visitors={visitors}
              loading={loading}
              busyId={busyId}
              removeConfirmId={removeConfirmId}
              onMakeMember={handleMakeMember}
              onRequestRemove={setRemoveConfirmId}
              onConfirmRemove={removeVisitor}
              onCancelRemove={() => setRemoveConfirmId(null)}
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
