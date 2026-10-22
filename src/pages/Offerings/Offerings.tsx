import { useState } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import OfferingsTable from "../../components/offerings/OfferingsTable";
import { fmtPeso } from "../../components/finance/financeFormat";
import useOfferings from "../../hooks/useOfferings";
import type { OfferingService } from "../../types/offering";
import { useCurrentUserName } from "../../auth/authContext";
import "../Finance/finance.css";
import "./offerings.css";

const CAN_MANAGE = true; // TODO: derive from role (Admin/Moderator) once available

type ServiceFilter = "all" | OfferingService;

const SERVICE_FILTERS: { value: ServiceFilter; label: string; icon?: string }[] = [
  { value: "all", label: "All" },
  { value: "Sunday", label: "Sunday", icon: "fa-church" },
  { value: "Wednesday", label: "Wednesday", icon: "fa-book-bible" },
];

export default function Offerings() {
  const currentUser = useCurrentUserName();
  const {
    monthLabel,
    stepMonth,
    goToCurrentMonth,
    isCurrentMonth,
    canStepForward,
    days,
    entries,
    rowStatus,
    loading,
    error,
    handleAmountChange,
    flushSave,
    total,
    sundayTotal,
    wednesdayTotal,
    recordedCount,
    pastServiceCount,
    averagePerService,
  } = useOfferings(currentUser);

  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const visibleDays = serviceFilter === "all" ? days : days.filter((d) => d.service === serviceFilter);
  const visibleTotal =
    serviceFilter === "all" ? total : serviceFilter === "Sunday" ? sundayTotal : wednesdayTotal;

  const v = (n: number) => (loading ? "…" : fmtPeso(n));

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Offerings</h1>
              <p>Enter the total offering for each Wednesday and Sunday service — changes save automatically.</p>
            </div>
          </div>

          <div className="finance-period">
            <div className="finance-period-stepper">
              <button type="button" onClick={() => stepMonth(-1)} aria-label="Previous month" title="Previous month">
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className="finance-period-label" aria-live="polite">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => stepMonth(1)}
                disabled={!canStepForward}
                aria-label="Next month"
                title="Next month"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
            {!isCurrentMonth && (
              <button type="button" className="finance-period-today" onClick={goToCurrentMonth}>
                Back to this month
              </button>
            )}

            <div className="finance-period-modes offering-filter" role="group" aria-label="Show services">
              {SERVICE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  className={serviceFilter === f.value ? "is-active" : undefined}
                  aria-pressed={serviceFilter === f.value}
                  onClick={() => setServiceFilter(f.value)}
                >
                  {f.icon && <i className={`fa-solid ${f.icon}`} aria-hidden="true" />} {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="summary-cards offering-kpis">
            <div className="summary-card">
              <span className="summary-card-value" style={{ color: "var(--success)" }}>
                {v(total)}
              </span>
              <span className="summary-card-label">Total Offerings — {monthLabel}</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{v(sundayTotal)}</span>
              <span className="summary-card-label">
                <i className="fa-solid fa-church" aria-hidden="true" /> Sunday Services
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{v(wednesdayTotal)}</span>
              <span className="summary-card-label">
                <i className="fa-solid fa-book-bible" aria-hidden="true" /> Wednesday Services
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-card-value">{v(averagePerService)}</span>
              <span className="summary-card-label">
                Average per service · {loading ? "…" : `${recordedCount} of ${pastServiceCount} recorded`}
              </span>
            </div>
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          <div className="members-card">
            <OfferingsTable
              days={visibleDays}
              entries={entries}
              rowStatus={rowStatus}
              loading={loading}
              canManage={CAN_MANAGE}
              monthLabel={serviceFilter === "all" ? monthLabel : `${serviceFilter}s, ${monthLabel}`}
              total={visibleTotal}
              onAmountChange={handleAmountChange}
              onBlur={flushSave}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
