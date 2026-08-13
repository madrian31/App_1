import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useSundaySchoolTeachers from "../../hooks/useSundaySchoolTeachers";
import SundaySchoolTeachersToolbar from "../../components/sundaySchool/SundaySchoolTeachersToolbar";
import SundaySchoolTeachersTable from "../../components/sundaySchool/SundaySchoolTeachersTable";
import Pagination from "../../components/members/Pagination";
import Toast from "../../components/members/Toast";
import AddTeachersModal from "../../components/sundaySchool/AddTeachersModal";
import "./sundaySchool.css";

export default function SundaySchoolTeachers() {
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    loading,
    allMembers,
    members,
    teacherCount,
    assistantCount,
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
    toggleTeacher,
    toggleAssistant,
  } = useSundaySchoolTeachers();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Sunday School Teachers</h1>
              <p>
                {teacherCount} teacher{teacherCount !== 1 ? "s" : ""} · {assistantCount} assistant
                {assistantCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="page-header-actions">
              <button className="btn-add" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-user-plus" aria-hidden="true" />
                Add Members
              </button>
            </div>
          </div>

          <SundaySchoolTeachersToolbar
            search={search}
            onSearchChange={onSearchChange}
            filter={filter}
            onFilterChange={onFilterChange}
          />

          <div className="members-card">
            <SundaySchoolTeachersTable
              members={members}
              loading={loading}
              onToggleTeacher={toggleTeacher}
              onToggleAssistant={toggleAssistant}
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
            <AddTeachersModal
              members={allMembers}
              onToggleTeacher={toggleTeacher}
              onToggleAssistant={toggleAssistant}
              onClose={() => setShowAddModal(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}