import { Sidebar } from "../../components/sidebar/Sidebar";
import useExpenses, { EXPENSE_MONTHS } from "../../hooks/useExpenses";
import ExpenseCategorySummary from "../../components/expenses/ExpenseCategorySummary";
import ExpensesToolbar from "../../components/expenses/ExpensesToolbar";
import ExpensesTable from "../../components/expenses/ExpensesTable";
import ExpenseFormModal from "../../components/expenses/ExpenseFormModal";
import "../Ledger/ledger.css";
import "./expenses.css";

// TODO: replace with the actual logged-in user's name/role once auth/session
// wiring is in place — mirrors the TODO already in Ledger.tsx.
const CURRENT_USER = "Unknown";
const CAN_MANAGE = true; // TODO: derive from role (Admin/Moderator) once available

export default function Expenses() {
  const {
    curMonth,
    setCurMonth,
    curYear,
    setCurYear,
    years,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    categories,
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
    saveEntry,
    removeEntry,
    exportCSV,
    total,
    filteredTotal,
    categoryTotals,
  } = useExpenses(CURRENT_USER);

  const monthLabel = `${EXPENSE_MONTHS[curMonth]} ${curYear}`;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Expenses</h1>
              <p>Bills and expenses to pay for {monthLabel} — electricity, internet, water, and others.</p>
            </div>
          </div>

          <ExpenseCategorySummary
            loading={loading}
            total={total}
            entryCount={entryCount}
            categoryTotals={categoryTotals}
            monthLabel={monthLabel}
            activeCategory={categoryFilter}
            onSelectCategory={setCategoryFilter}
          />

          <ExpensesToolbar
            search={search}
            onSearchChange={setSearch}
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
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

          {error && !showForm && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="members-card">
            <ExpensesTable
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

          {showForm && (
            <ExpenseFormModal
              form={form}
              categories={categories}
              isEditing={Boolean(editingId)}
              saving={saving}
              canSave={canSave}
              error={error}
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
