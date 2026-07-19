import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useMembers from "../../hooks/useMembers";
import MembersToolbar from "../../components/members/MembersToolbar";
import MembersTable from "../../components/members/MembersTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import "./members.css";

export default function Members() {
  const navigate = useNavigate();
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
  } = useMembers();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Members</h1>
              <p>
                {activeCount} member{activeCount !== 1 ? "s" : ""} total
              </p>
            </div>
            <button className="btn-add" onClick={() => navigate("/Profile/new")}>
              <i className="fa-solid fa-user-plus" />
              Add Member
            </button>
          </div>

          <MembersToolbar search={search} onSearchChange={onSearchChange} />

          <div className="members-card">
            <MembersTable members={members} loading={loading} onArchive={archiveMember} />
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