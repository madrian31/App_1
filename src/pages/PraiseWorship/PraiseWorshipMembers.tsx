import { useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import usePraiseWorshipMembers from "../../hooks/usePraiseWorshipMembers";
import type { SkillFilter } from "../../hooks/usePraiseWorshipMembers";
import PraiseWorshipMembersTable from "../../components/praiseWorship/PraiseWorshipMembersTable";
import AddPraiseWorshipMembersModal from "../../components/praiseWorship/AddPraiseWorshipMembersModal";
import EditPositionsModal from "../../components/praiseWorship/EditPositionsModal";
import Toast from "../../components/members/Toast";
import { PW_SKILLS } from "../../types/praiseWorship";
import "../SundaySchool/sundaySchool.css"; // shared modal + checklist styles
import "./praiseWorship.css";

export default function PraiseWorshipMembers() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const {
    loading,
    allMembers,
    team,
    teamCount,
    search,
    setSearch,
    skillFilter,
    setSkillFilter,
    toast,
    setOnTeam,
    saveSkills,
  } = usePraiseWorshipMembers();

  const editing = editingId ? allMembers.find((m) => m.id === editingId) : undefined;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Praise &amp; Worship Team</h1>
              <p>
                {teamCount} member{teamCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="page-header-actions">
              <Link to="/PraiseWorship/LineUp" className="btn-secondary">
                <i className="fa-solid fa-list-ol" aria-hidden="true" />
                Set Line-up
              </Link>
              <button className="btn-add" onClick={() => setShowAddModal(true)}>
                <i className="fa-solid fa-user-plus" aria-hidden="true" />
                Add Members
              </button>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="filter-select-wrap">
              <i className="fa-solid fa-filter" aria-hidden="true" />
              <select value={skillFilter} onChange={(e) => setSkillFilter(e.target.value as SkillFilter)}>
                <option value="all">All Positions</option>
                {PW_SKILLS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
                <option value="none">No positions yet</option>
              </select>
            </div>
          </div>

          <div className="members-card">
            <PraiseWorshipMembersTable
              members={team}
              loading={loading}
              onEditPositions={setEditingId}
              onRemove={(id) => setOnTeam(id, false)}
            />
          </div>

          <Toast message={toast} />

          {showAddModal && (
            <AddPraiseWorshipMembersModal
              members={allMembers}
              onSetOnTeam={setOnTeam}
              onClose={() => setShowAddModal(false)}
            />
          )}

          {editing && (
            <EditPositionsModal
              memberName={`${editing.firstName} ${editing.lastName}`}
              skills={editing.praiseWorshipSkills ?? []}
              onSave={(skills) => saveSkills(editing.id, skills)}
              onClose={() => setEditingId(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
