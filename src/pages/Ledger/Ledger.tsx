import { useParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useLedger, { LEDGER_MONTHS } from "../../hooks/useLedger";
import { LEDGER_DEPARTMENT_LABELS, type LedgerDepartment } from "../../types/ledger";
import LedgerKpiStrip from "../../components/ledger/LedgerKpiStrip";
import LedgerToolbar from "../../components/ledger/LedgerToolbar";
import LedgerTable from "../../components/ledger/LedgerTable";
import LedgerFormModal from "../../components/ledger/LedgerFormModal";
import "./ledger.css";

// TODO: replace with the actual logged-in user's name/role once auth/session
// wiring is in place — mirrors the TODO already in PledgeTracker.tsx.
const CURRENT_USER = "Unknown";
const CAN_MANAGE = true; // TODO: derive from role (Admin/Moderator) once available

const VALID_DEPARTMENTS = Object.keys(LEDGER_DEPARTMENT_LABELS) as LedgerDepartment[];

export default function Ledger() {
  const { department: departmentParam } = useParams<{ department: string }>();
  const department: LedgerDepartment = VALID_DEPARTMENTS.includes(departmentParam as LedgerDepartment)
    ? (departmentParam as LedgerDepartment)
    : "members";

  const {
    curMonth,
    setCurMonth,
    curYear,
    setCurYear,
    years,
    entries,
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
    saveEntry,
    removeEntry,
    totalExpenses,
    totalLoanOut,
    totalRepayment,
    netOutflow,
  } = useLedger(department, CURRENT_USER);

  const monthLabel = `${LEDGER_MONTHS[curMonth]} ${curYear}`;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>{LEDGER_DEPARTMENT_LABELS[department]} Ledger</h1>
              <p>Track expenses, loans, and repayments for {monthLabel}.</p>
            </div>
          </div>

          <LedgerKpiStrip
            totalExpenses={totalExpenses}
            totalLoanOut={totalLoanOut}
            totalRepayment={totalRepayment}
            netOutflow={netOutflow}
            entryCount={entries.length}
          />

          <LedgerToolbar
            curMonth={curMonth}
            onMonthChange={setCurMonth}
            curYear={curYear}
            onYearChange={setCurYear}
            years={years}
            canManage={CAN_MANAGE}
            onAddEntry={openAddForm}
          />

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="members-card">
            <LedgerTable
              entries={entries}
              loading={loading}
              canManage={CAN_MANAGE}
              netOutflow={netOutflow}
              monthLabel={monthLabel}
              deleteConfirmId={deleteConfirmId}
              onEdit={openEditForm}
              onRequestDelete={setDeleteConfirmId}
              onConfirmDelete={removeEntry}
              onCancelDelete={() => setDeleteConfirmId(null)}
            />
          </div>

          {showForm && (
            <LedgerFormModal
              form={form}
              isEditing={Boolean(editingId)}
              saving={saving}
              canSave={canSave}
              onChange={updateForm}
              onSave={saveEntry}
              onClose={closeForm}
            />
          )}
        </div>
      </main>
    </div>
  );
}
