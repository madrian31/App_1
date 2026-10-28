import { useSearchParams } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import AutoSaveStatus from "../../components/settings/AutoSaveStatus";
import DepartmentActivitiesTable from "../../components/departmentFunds/DepartmentActivitiesTable";
import DepartmentBudgetTable from "../../components/departmentFunds/DepartmentBudgetTable";
import DepartmentFundsTable from "../../components/departmentFunds/DepartmentFundsTable";
import DepartmentFundFormModal from "../../components/departmentFunds/DepartmentFundFormModal";
import { fmtPeso } from "../../components/finance/financeFormat";
import Pagination from "../../components/members/Pagination";
import useDepartmentFunds, { ACTIVITIES_PER_PAGE, ACTIVITY_PERIODS } from "../../hooks/useDepartmentFunds";
import { MONTHS } from "../../types/calendarEvent";
import { useCurrentUserName } from "../../auth/authContext";
import "../Ledger/ledger.css";
import "../Finance/finance.css";
import "../Settings/settings.css";
import "./departmentFunds.css";

export default function DepartmentFunds() {
  const currentUser = useCurrentUserName();
  // ?activity=<event id> opens the page on that activity (the Finance Report links here).
  const [params] = useSearchParams();
  const d = useDepartmentFunds(currentUser, { focusActivityKey: params.get("activity") });
  const v = (n: number) => (d.loading ? "…" : fmtPeso(n));
  const budgetLeft = d.totalBudget - d.totalUsed;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Department Funds</h1>
              <p>
                Each department's activities and their allocated budget, the budget given from the General Fund, and
                the receipts and unused budget handed back — {d.year}.
              </p>
            </div>
          </div>

          <div className="summary-cards finance-kpis">
            <div className="summary-card">
              <span className="summary-card-value">{v(d.totalBudget)}</span>
              <span className="summary-card-label">Allocated Budget — {d.year}</span>
              <span className="finance-kpi-sub">Total of the departments' activities</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{v(d.totalGiven)}</span>
              <span className="summary-card-label">Budget Given — {d.year}</span>
              <span className="finance-kpi-sub">
                {d.loading || d.totalReturned === 0
                  ? "Taken from the General Fund"
                  : `${fmtPeso(d.totalReturned)} unused budget returned`}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value" style={budgetLeft < 0 ? { color: "var(--danger)" } : undefined}>
                {d.loading ? "…" : `${budgetLeft < 0 ? "−" : ""}${fmtPeso(Math.abs(budgetLeft))}`}
              </span>
              <span className="summary-card-label">Budget Left — {d.year}</span>
              <span className="finance-kpi-sub">
                {budgetLeft < 0 ? "More was given than allocated" : "Allocated but not given yet"}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value" style={d.totalUnliquidated > 0 ? { color: "#b45309" } : undefined}>
                {v(d.totalUnliquidated)}
              </span>
              <span className="summary-card-label">Not Yet Liquidated</span>
              <span className="finance-kpi-sub">
                {d.loading
                  ? ""
                  : d.pendingCount > 0
                    ? `${d.pendingCount} ${d.pendingCount === 1 ? "entry is" : "entries are"} waiting for receipts`
                    : "All budget given is accounted for"}
              </span>
            </div>
          </div>

          <div className="toolbar">
            <div className="search-wrap">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search activity or name…"
                value={d.search}
                onChange={(e) => d.setSearch(e.target.value)}
              />
            </div>

            <div className="filter-select-wrap">
              <i className="fa-solid fa-filter" aria-hidden="true" />
              <select value={d.departmentFilter} onChange={(e) => d.setDepartmentFilter(e.target.value)}>
                <option value="">All departments</option>
                {d.departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-select-wrap">
              <i className="fa-regular fa-calendar" aria-hidden="true" />
              <select value={d.year} onChange={(e) => d.setYear(Number(e.target.value))}>
                {d.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-add" onClick={d.openAddForm}>
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Add Budget
            </button>
          </div>

          {d.error && !d.showForm && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {d.error}
            </div>
          )}

          <section className="report-section">
            <h2 className="report-section-title">Budget per Department — {d.year}</h2>
            <DepartmentBudgetTable
              rows={d.summaryRows}
              loading={d.loading}
              year={d.year}
              totals={{
                budget: d.totalBudget,
                given: d.totalGiven,
                returned: d.totalReturned,
                used: d.totalUsed,
                unliquidated: d.totalUnliquidated,
              }}
              activeDepartment={d.departmentFilter}
              onSelectDepartment={d.setDepartmentFilter}
            />
          </section>

          <section className="report-section">
            <div className="dept-section-head">
              <h2 className="report-section-title">Activities — {d.activityPeriodLabel}</h2>
              <AutoSaveStatus status={d.activitySaveStatus} onRetry={d.retryActivitySaves} />
            </div>
            <p className="dept-section-help">
              From the Calendar. Pick each activity's department and type its allocated budget — changes save
              automatically. A department's budget is the total of its activities.
            </p>
            {!d.loading && d.unassignedBudgetCount > 0 && (
              <p className="dept-fund-warning">
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />{" "}
                {d.unassignedBudgetCount === 1
                  ? `In ${d.year}, 1 activity has an allocated budget but no department yet.`
                  : `In ${d.year}, ${d.unassignedBudgetCount} activities have an allocated budget but no department yet.`}{" "}
                Pick a department so its budget is counted.
              </p>
            )}

            <div className="finance-period dept-activity-period">
              <div className="finance-period-modes" role="group" aria-label="Show activities for">
                {ACTIVITY_PERIODS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    className={d.activityPeriod === p.value ? "is-active" : undefined}
                    aria-pressed={d.activityPeriod === p.value}
                    onClick={() => d.setActivityPeriod(p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {d.activityPeriod === "month" && (
                <div className="filter-select-wrap">
                  <i className="fa-regular fa-calendar" aria-hidden="true" />
                  <select
                    value={d.activityMonth}
                    onChange={(e) => d.setActivityMonth(Number(e.target.value))}
                    aria-label="Month"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={m} value={i}>
                        {m} {d.year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {d.activityPeriod === "custom" && (
                <div className="finance-date-range">
                  <label>
                    <span>From</span>
                    <input type="date" value={d.activityFrom} onChange={(e) => d.setActivityFrom(e.target.value)} />
                  </label>
                  <span className="month-range-arrow" aria-hidden="true">
                    →
                  </span>
                  <label>
                    <span>To</span>
                    <input type="date" value={d.activityTo} onChange={(e) => d.setActivityTo(e.target.value)} />
                  </label>
                </div>
              )}

              <label className="dept-show-all">
                <input
                  type="checkbox"
                  checked={d.showAllActivities}
                  onChange={(e) => d.setShowAllActivities(e.target.checked)}
                />
                Show all calendar activities ({d.loading ? "…" : d.activityCount})
              </label>
            </div>

            <div className="members-card">
              <DepartmentActivitiesTable
                rows={d.activities}
                loading={d.loading}
                periodLabel={d.activityPeriodLabel}
                departments={d.departments}
                showAll={d.showAllActivities}
                highlightKey={d.highlightKey}
                onDepartmentChange={d.setActivityDepartment}
                onBudgetCommit={d.setActivityBudget}
                onAddBudget={d.openAddForActivity}
              />
              {!d.loading && d.activityMatchCount > 0 && (
                <Pagination
                  pageSize={ACTIVITIES_PER_PAGE}
                  currentPage={d.activityPage}
                  totalPages={d.activityTotalPages}
                  start={d.activityStart}
                  filteredCount={d.activityMatchCount}
                  itemLabel="activity"
                  itemLabelPlural="activities"
                  onFirst={() => d.goToActivityPage(1)}
                  onPrev={() => d.goToActivityPage(d.activityPage - 1)}
                  onNext={() => d.goToActivityPage(d.activityPage + 1)}
                  onLast={() => d.goToActivityPage(d.activityTotalPages)}
                />
              )}
            </div>
          </section>

          <section className="report-section">
            <h2 className="report-section-title">Budget Given — {d.year}</h2>
            <div className="members-card">
              <DepartmentFundsTable
                entries={d.entries}
                loading={d.loading}
                year={d.year}
                departmentName={d.departmentName}
                deleteConfirmId={d.deleteConfirmId}
                onEdit={d.openEditForm}
                onRequestDelete={d.setDeleteConfirmId}
                onConfirmDelete={d.removeEntry}
                onCancelDelete={() => d.setDeleteConfirmId(null)}
              />
            </div>
          </section>

          {d.showForm && (
            <DepartmentFundFormModal
              form={d.form}
              departments={d.formDepartments}
              year={d.year}
              activities={d.formActivities}
              activityInfo={d.formActivityInfo}
              onChooseActivity={d.chooseActivity}
              isEditing={Boolean(d.editingId)}
              saving={d.saving}
              canSave={d.canSave}
              problem={d.formProblem}
              budgetWarning={d.budgetWarning}
              unliquidated={d.formUnliquidated}
              error={d.error}
              onChange={d.updateForm}
              onSave={d.saveEntry}
              onClose={d.closeForm}
            />
          )}
        </div>
      </main>
    </div>
  );
}
