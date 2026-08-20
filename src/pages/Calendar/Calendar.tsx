import { useRef } from "react";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useCalendar from "../../hooks/useCalendar";
import { MONTHS, WEEKDAYS, type CalendarView } from "../../types/calendarEvent";
import MonthView from "../../components/calendar/MonthView";
import TimeGridView from "../../components/calendar/TimeGridView";
import AgendaView from "../../components/calendar/AgendaView";
import CalendarFilters from "../../components/calendar/CalendarFilters";
import EventFormModal from "../../components/calendar/EventFormModal";
import DayEventsModal from "../../components/calendar/DayEventsModal";
import "./calendar.css";

const VIEW_OPTIONS: { key: CalendarView; label: string }[] = [
  { key: "month", label: "Month" },
  { key: "week", label: "Week" },
  { key: "day", label: "Day" },
  { key: "agenda", label: "Agenda" },
];

function periodLabel(view: CalendarView, d: Date): string {
  if (view === "month") return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  if (view === "week") {
    const start = new Date(d);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    return sameMonth
      ? `${MONTHS[start.getMonth()].slice(0, 3)} ${start.getDate()}–${end.getDate()}`
      : `${MONTHS[start.getMonth()].slice(0, 3)} ${start.getDate()} – ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getDate()}`;
  }
  if (view === "day") return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
  return `Starting ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export default function CalendarPage() {
  const importInputRef = useRef<HTMLInputElement>(null);

  const {
    today,
    view,
    setView,
    currentDate,

    activeCats,
    setActiveCats,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFilterOptions,

    eventsForDay,
    chips,
    removeChip,
    resetAllFilters,

    goPrev,
    goNext,
    goToday,

    showEventModal,
    editingId,
    form,
    openCreateModal,
    openEditModal,
    closeEventModal,
    updateForm,
    submitEventForm,
    deleteEvent,

    dayModalDate,
    openDayModal,
    closeDayModal,

    importICS,
    agendaEntries,

    toast,
  } = useCalendar();

  function handleImportClick() {
    importInputRef.current?.click();
  }
  function handleImportChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) importICS(file);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page calendar-page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Calendar</h1>
              <p>Events, activities, birthdays, and more — all in one place.</p>
            </div>
            <div className="page-header-actions">
              <button className="btn-secondary" onClick={handleImportClick}>
                <i className="fa-solid fa-file-import" aria-hidden="true" />
                <span className="label">Import</span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".ics,text/calendar"
                style={{ display: "none" }}
                onChange={handleImportChange}
              />
              <button className="btn-add" onClick={() => openCreateModal()}>
                <i className="fa-solid fa-plus" aria-hidden="true" />
                <span className="label">New Event</span>
              </button>
            </div>
          </div>

          <div className="calendar-nav-row">
            <div className="view-toggle" role="tablist" aria-label="View as">
              {VIEW_OPTIONS.map((opt) => (
                <button key={opt.key} className={view === opt.key ? "active" : ""} onClick={() => setView(opt.key)}>
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="nav-controls">
              <button className="nav-btn" aria-label="Previous" onClick={goPrev}>
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span className="period-label">{periodLabel(view, currentDate)}</span>
              <button className="nav-btn" aria-label="Next" onClick={goNext}>
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
              <button className="today-btn" onClick={goToday}>
                Today
              </button>
            </div>
          </div>

          <CalendarFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCats={activeCats}
            onActiveCatsChange={setActiveCats}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            customFrom={customFrom}
            onCustomFromChange={setCustomFrom}
            customTo={customTo}
            onCustomToChange={setCustomTo}
            dateFilterOptions={dateFilterOptions}
            chips={chips}
            onRemoveChip={removeChip}
            onResetAll={resetAllFilters}
          />

          <div className="view-shell members-card">
            {view === "month" && (
              <MonthView
                currentDate={currentDate}
                today={today}
                eventsForDay={eventsForDay}
                onOpenDay={openDayModal}
                onOpenEvent={openEditModal}
              />
            )}
            {(view === "week" || view === "day") && (
              <TimeGridView
                numDays={view === "week" ? 7 : 1}
                currentDate={currentDate}
                today={today}
                eventsForDay={eventsForDay}
                onOpenEvent={openEditModal}
              />
            )}
            {view === "agenda" && <AgendaView entries={agendaEntries} today={today} onOpenEvent={openEditModal} />}
          </div>

          {toast && (
            <div className={`calendar-toast show${toast.error ? " error" : ""}`}>{toast.message}</div>
          )}

          {showEventModal && (
            <EventFormModal
              form={form}
              isEditing={Boolean(editingId)}
              onChange={updateForm}
              onSave={submitEventForm}
              onDelete={() => editingId && deleteEvent(editingId)}
              onClose={closeEventModal}
            />
          )}

          {dayModalDate && (
            <DayEventsModal
              dateIso={dayModalDate}
              events={eventsForDay(new Date(`${dayModalDate}T00:00:00`))}
              onOpenEvent={openEditModal}
              onAddOnThisDay={() => {
                const d = dayModalDate;
                closeDayModal();
                openCreateModal(d);
              }}
              onClose={closeDayModal}
            />
          )}
        </div>
      </main>
    </div>
  );
}
