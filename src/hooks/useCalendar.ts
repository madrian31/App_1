import { useEffect, useMemo, useState } from "react";
import {
  CATEGORY_KEYS,
  DATE_FILTERS,
  type CalendarCategory,
  type CalendarEvent,
  type CalendarView,
  type DateFilterKey,
  type FilterChip,
} from "../types/calendarEvent";
import { parseICS } from "../utils/icsParser";
import * as calendarEventsService from "../services/calendar/calendarEventsService";

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}
export function iso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
export function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}
export function fmtTime(t: string): string {
  const [hStr, m] = t.split(":");
  const hh = parseInt(hStr, 10);
  const ap = hh >= 12 ? "PM" : "AM";
  let h12 = hh % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m} ${ap}`;
}

export interface EventFormState {
  title: string;
  date: string;
  start: string;
  end: string;
  cat: CalendarCategory;
}

const EMPTY_FORM: EventFormState = { title: "", date: "", start: "09:00", end: "10:00", cat: "events" };

export default function useCalendar() {
  const today = useMemo(() => new Date(), []);

  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    calendarEventsService
      .getAllEvents()
      .then((fetched) => {
        if (!cancelled) setEvents(fetched);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load events. Please check your connection and try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Applied filters
  const [activeCats, setActiveCats] = useState<Set<CalendarCategory>>(new Set(CATEGORY_KEYS));
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Modal state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(EMPTY_FORM);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; error?: boolean } | null>(null);

  function showToast(message: string, error = false) {
    setToast({ message, error });
    setTimeout(() => setToast(null), 3200);
  }

  function inDateFilter(dateStr: string): boolean {
    if (dateFilter === "all") return true;
    const d = new Date(`${dateStr}T00:00:00`);
    if (dateFilter === "today") return sameDay(d, today);
    if (dateFilter === "week") {
      const wStart = addDays(today, -today.getDay());
      const wEnd = addDays(wStart, 6);
      return (
        d >= new Date(wStart.getFullYear(), wStart.getMonth(), wStart.getDate()) &&
        d <= new Date(wEnd.getFullYear(), wEnd.getMonth(), wEnd.getDate())
      );
    }
    if (dateFilter === "month") return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
    if (dateFilter === "custom") {
      if (customFrom && dateStr < customFrom) return false;
      if (customTo && dateStr > customTo) return false;
      return true;
    }
    return true;
  }

  function matchesFilters(e: CalendarEvent): boolean {
    if (!activeCats.has(e.cat)) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (!inDateFilter(e.date)) return false;
    return true;
  }

  const filteredEvents = useMemo(() => events.filter(matchesFilters), [events, activeCats, searchQuery, dateFilter, customFrom, customTo]);

  function eventsForDay(dateObj: Date): CalendarEvent[] {
    const key = iso(dateObj);
    return filteredEvents.filter((e) => e.date === key).sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  }

  // ---- Active filter chips ----
  const chips: FilterChip[] = [];
  if (searchQuery) chips.push({ type: "search" });
  if (activeCats.size < CATEGORY_KEYS.length) {
    CATEGORY_KEYS.forEach((k) => {
      if (activeCats.has(k)) chips.push({ type: "cat", key: k });
    });
  }
  if (dateFilter !== "all") chips.push({ type: "date" });

  function removeChip(chip: FilterChip) {
    if (chip.type === "search") setSearchQuery("");
    else if (chip.type === "cat") {
      setActiveCats((prev) => {
        const next = new Set(prev);
        next.delete(chip.key);
        return next.size === 0 ? new Set(CATEGORY_KEYS) : next;
      });
    } else if (chip.type === "date") {
      setDateFilter("all");
      setCustomFrom("");
      setCustomTo("");
    }
  }

  function resetAllFilters() {
    setActiveCats(new Set(CATEGORY_KEYS));
    setSearchQuery("");
    setDateFilter("all");
    setCustomFrom("");
    setCustomTo("");
  }

  // ---- Navigation ----
  function goPrev() {
    if (view === "month") setCurrentDate((d) => addMonths(d, -1));
    else if (view === "week") setCurrentDate((d) => addDays(d, -7));
    else setCurrentDate((d) => addDays(d, -1));
  }
  function goNext() {
    if (view === "month") setCurrentDate((d) => addMonths(d, 1));
    else if (view === "week") setCurrentDate((d) => addDays(d, 7));
    else setCurrentDate((d) => addDays(d, 1));
  }
  function goToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  }

  // ---- Event modal ----
  function openCreateModal(prefillDateIso?: string) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, date: prefillDateIso || iso(view === "month" ? today : currentDate) });
    setShowEventModal(true);
  }
  function openEditModal(eventId: string) {
    const e = events.find((ev) => ev.id === eventId);
    if (!e) return;
    setEditingId(eventId);
    setForm({ title: e.title, date: e.date, start: e.start, end: e.end, cat: e.cat });
    setShowEventModal(true);
  }
  function closeEventModal() {
    setShowEventModal(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }
  function updateForm<K extends keyof EventFormState>(key: K, value: EventFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  async function submitEventForm() {
    if (!form.title.trim() && !form.date) return;
    setSaving(true);
    try {
      if (editingId) {
        await calendarEventsService.updateEvent(editingId, { ...form, title: form.title || "Untitled Event" });
        setEvents((prev) =>
          prev.map((ev) => (ev.id === editingId ? { ...ev, ...form, title: form.title || "Untitled Event" } : ev))
        );
        showToast("Event updated ✓");
      } else {
        const newEvent = { ...form, title: form.title || "Untitled Event" };
        const id = await calendarEventsService.addEvent(newEvent);
        setEvents((prev) => [...prev, { id, ...newEvent }]);
        showToast("Event created ✓");
      }
      setCurrentDate(new Date(`${form.date}T00:00:00`));
      closeEventModal();
    } catch {
      showToast("Could not save the event. Please try again.", true);
    } finally {
      setSaving(false);
    }
  }
  async function deleteEvent(id: string) {
    setSaving(true);
    try {
      await calendarEventsService.deleteEvent(id);
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
      closeEventModal();
      showToast("Event deleted");
    } catch {
      showToast("Could not delete the event. Please try again.", true);
    } finally {
      setSaving(false);
    }
  }

  // ---- Day popover ----
  function openDayModal(dateIso: string) {
    setDayModalDate(dateIso);
  }
  function closeDayModal() {
    setDayModalDate(null);
  }

  // ---- Import (.ics) ----
  function importICS(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const imported = parseICS(String(reader.result));
        if (imported.length === 0) {
          showToast("No events found in that file.", true);
          return;
        }
        const newEvents = imported.map(({ id: _id, ...rest }) => rest);
        const written = await calendarEventsService.bulkAddEvents(newEvents);
        setEvents((prev) => [...prev, ...written]);
        showToast(`Imported ${written.length} event${written.length === 1 ? "" : "s"} ✓`);
      } catch {
        showToast("Could not read that file. Make sure it's a valid .ics calendar file.", true);
      }
    };
    reader.onerror = () => showToast("Could not read that file.", true);
    reader.readAsText(file);
  }

  // ---- Agenda (upcoming, respects date filter) ----
  const agendaEntries = useMemo(() => {
    return filteredEvents
      .map((e) => ({ e, d: new Date(`${e.date}T00:00:00`) }))
      .filter((x) => dateFilter !== "all" || x.d >= new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()))
      .sort((a, b) => a.d.getTime() - b.d.getTime() || timeToMinutes(a.e.start) - timeToMinutes(b.e.start));
  }, [filteredEvents, dateFilter, currentDate]);

  return {
    today,
    view,
    setView,
    currentDate,
    loading,
    error,
    saving,
    events,

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
    dateFilterOptions: DATE_FILTERS,

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
  };
}