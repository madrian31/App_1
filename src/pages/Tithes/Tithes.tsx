import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useTithes, { TITHE_MONTHS } from "../../hooks/useTithes";
import TithesKpiStrip from "../../components/tithes/TithesKpiStrip";
import TithesToolbar from "../../components/tithes/TithesToolbar";
import TithesTable from "../../components/tithes/TithesTable";
import TitheFormModal from "../../components/tithes/TitheFormModal";
import TithesMemberView from "../../components/tithes/TithesMemberView";
import { useCurrentUserName } from "../../auth/authContext";
import "../Ledger/ledger.css";
import "../Finance/finance.css";
import "./tithes.css";

const CAN_MANAGE = true; // TODO: derive from role (Admin/Moderator) once available

type TithesView = "members" | "entries";

export default function Tithes() {
  const currentUser = useCurrentUserName();
  const [view, setView] = useState<TithesView>("members");
  const {
    curMonth,
    setCurMonth,
    curYear,
    setCurYear,
    years,
    search,
    setSearch,
    entries,
    entryCount,
    loading,
    error,
    showForm,
    form,
    editingId,
    saving,
    canSave,
    deleteConfirmId,
    setDeleteConfirmId,
    openAddForm,
    openEditForm,
    closeForm,
    updateForm,
    setAnonymous,
    selectMember,
    saveEntry,
    removeEntry,
    exportCSV,
    refetch,
    total,
    giverCount,
    averagePerService,
    filteredTotal,
  } = useTithes(currentUser);

  const monthLabel = `${TITHE_MONTHS[curMonth]} ${curYear}`;

  function switchView(next: TithesView) {
    if (next === view) return;
    // The Members grid may have saved tithes since the list was loaded.
    if (next === "entries") refetch();
    setView(next);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Tithes</h1>
              <p>
                {view === "members"
                  ? "Enter each member's tithe for the selected Sunday — changes save automatically."
                  : `Record and review tithes received for ${monthLabel}.`}
              </p>
            </div>
          </div>

          <div className="tithe-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={view === "members"}
              className={`tithe-tab${view === "members" ? " is-active" : ""}`}
              onClick={() => switchView("members")}
            >
              <i className="fa-solid fa-users" aria-hidden="true" />
              Members
            </button>
            <button
              role="tab"
              aria-selected={view === "entries"}
              className={`tithe-tab${view === "entries" ? " is-active" : ""}`}
              onClick={() => switchView("entries")}
            >
              <i className="fa-solid fa-list" aria-hidden="true" />
              Entries
            </button>
          </div>

          {view === "members" ? (
            <TithesMemberView currentUser={currentUser} canManage={CAN_MANAGE} />
          ) : (
            <>
              <TithesKpiStrip
                total={total}
                giverCount={giverCount}
                averagePerService={averagePerService}
                entryCount={entryCount}
              />

              <TithesToolbar
                search={search}
                onSearchChange={setSearch}
                curMonth={curMonth}
                onMonthChange={setCurMonth}
                curYear={curYear}
                onYearChange={setCurYear}
                years={years}
                canManage={CAN_MANAGE}
                onAddEntry={openAddForm}
                onExportCSV={exportCSV}
                exportDisabled={entries.length === 0}
              />

              {error && (
                <div className="modal-error visit-form-error">
                  <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
                  {error}
                </div>
              )}

              <div className="members-card">
                <TithesTable
                  entries={entries}
                  loading={loading}
                  canManage={CAN_MANAGE}
                  total={filteredTotal}
                  monthLabel={monthLabel}
                  deleteConfirmId={deleteConfirmId}
                  onEdit={openEditForm}
                  onRequestDelete={setDeleteConfirmId}
                  onConfirmDelete={removeEntry}
                  onCancelDelete={() => setDeleteConfirmId(null)}
                />
              </div>
            </>
          )}

          {showForm && (
            <TitheFormModal
              form={form}
              isEditing={Boolean(editingId)}
              saving={saving}
              canSave={canSave}
              error={error}
              onChange={updateForm}
              onAnonymousChange={setAnonymous}
              onSelectMember={selectMember}
              onSave={saveEntry}
              onClose={closeForm}
            />
          )}
        </div>
      </main>
    </div>
  );
}
