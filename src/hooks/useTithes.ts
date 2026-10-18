import { useEffect, useMemo, useState } from "react";
import {
  addTithe,
  buildMemberTitheId,
  deleteTithe,
  getTithes,
  setTithe,
  titheExists,
  updateTithe,
} from "../services/tithes/tithesService";
import type { NewTithe, Tithe } from "../types/tithe";
import { formatDisplayDate, toLocalISODate } from "../utils/date";

export const TITHE_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const ANONYMOUS_NAME = "Anonymous";

export interface TitheForm {
  isAnonymous: boolean;
  memberId: string;
  memberName: string;
  date: string; // ISO date
  amount: string;
  notes: string;
}

/** Most recent Sunday on or before today — tithes are usually recorded for the Sunday service. */
export function lastSundayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return toLocalISODate(d);
}

function emptyForm(): TitheForm {
  return { isAnonymous: false, memberId: "", memberName: "", date: lastSundayISO(), amount: "", notes: "" };
}

function monthStartISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month, 1));
}
function monthEndISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month + 1, 0));
}

/**
 * Drives the Tithes page: month/year filter, search, entry list,
 * add/edit form state, delete confirmation, and derived KPI totals.
 */
export default function useTithes(currentUser: string) {
  const now = new Date();

  const [curMonth, setCurMonth] = useState(now.getMonth());
  const [curYear, setCurYear] = useState(now.getFullYear());
  const [search, setSearch] = useState("");

  const [entries, setEntries] = useState<Tithe[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<TitheForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  // `loading` is derived: true until the fetch for the current month/year/reload finishes.
  const fetchKey = `${curYear}-${curMonth}-${reloadKey}`;
  const loading = loadedKey !== fetchKey;

  useEffect(() => {
    let cancelled = false; // ignore a stale response after switching month/year
    getTithes(monthStartISO(curYear, curMonth), monthEndISO(curYear, curMonth))
      .then((list) => {
        if (cancelled) return;
        setEntries(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load tithes:", err);
        setEntries([]);
        setError("Failed to load tithes.");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(`${curYear}-${curMonth}-${reloadKey}`);
      });
    return () => {
      cancelled = true;
    };
  }, [curMonth, curYear, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  function openAddForm() {
    setForm(emptyForm());
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(entry: Tithe) {
    setForm({
      isAnonymous: !entry.memberId,
      memberId: entry.memberId,
      memberName: entry.memberId ? entry.memberName : entry.memberName === ANONYMOUS_NAME ? "" : entry.memberName,
      date: entry.date,
      amount: String(entry.amount),
      notes: entry.notes ?? "",
    });
    setEditingId(entry.id);
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function updateForm<K extends keyof TitheForm>(key: K, value: TitheForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setAnonymous(isAnonymous: boolean) {
    setForm((f) => ({ ...f, isAnonymous, memberId: "", memberName: "" }));
  }

  function selectMember(memberId: string, memberName: string) {
    setForm((f) => ({ ...f, memberId, memberName }));
  }

  const canSave =
    (parseFloat(form.amount) || 0) > 0 && Boolean(form.date) && (form.isAnonymous || Boolean(form.memberId));

  async function saveEntry() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload: NewTithe = {
        memberId: form.isAnonymous ? "" : form.memberId,
        memberName: form.isAnonymous ? form.memberName.trim() || ANONYMOUS_NAME : form.memberName,
        date: form.date,
        amount: parseFloat(form.amount) || 0,
        notes: form.notes.trim(),
        addedBy: currentUser,
      };
      if (!payload.memberId) {
        if (editingId) await updateTithe(editingId, payload);
        else await addTithe(payload);
      } else {
        // Member tithes live at a fixed `${memberId}_${date}` id (shared with the Members grid).
        const targetId = buildMemberTitheId(payload.memberId, payload.date);
        if (targetId !== editingId && (await titheExists(targetId))) {
          setError(`${payload.memberName} already has a tithe on ${formatDisplayDate(payload.date)} — edit that entry instead.`);
          return;
        }
        await setTithe(targetId, payload);
        // Member or date changed while editing → the record moved to a new id.
        if (editingId && editingId !== targetId) await deleteTithe(editingId);
      }
      // Jump to the saved entry's month so it doesn't seem to "disappear".
      const saved = new Date(`${payload.date}T00:00:00`);
      const sameMonth = saved.getMonth() === curMonth && saved.getFullYear() === curYear;
      closeForm();
      if (sameMonth) {
        refetch();
      } else {
        setCurMonth(saved.getMonth());
        setCurYear(saved.getFullYear());
      }
    } catch (err) {
      console.error("Failed to save tithe:", err);
      setError("Failed to save tithe.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    try {
      await deleteTithe(id);
      setDeleteConfirmId(null);
      refetch();
    } catch (err) {
      console.error("Failed to delete tithe:", err);
      setError("Failed to delete tithe.");
    }
  }

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.memberName.toLowerCase().includes(q) || (e.notes ?? "").toLowerCase().includes(q));
  }, [entries, search]);

  const totals = useMemo(() => {
    const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
    const giverCount = new Set(entries.map((e) => e.memberId || `anon:${e.memberName}`)).size;
    const sundayCount = new Set(entries.map((e) => e.date)).size;
    const filteredTotal = filteredEntries.reduce((s, e) => s + (e.amount || 0), 0);
    return {
      total,
      giverCount,
      averagePerService: sundayCount > 0 ? total / sundayCount : 0,
      filteredTotal,
    };
  }, [entries, filteredEntries]);

  function exportCSV() {
    let csv = "Date,Name,Amount,Notes,Added By\n";
    filteredEntries.forEach((e) => {
      const name = e.memberName.replace(/"/g, '""');
      const notes = (e.notes || "").replace(/"/g, '""');
      csv += `"${formatDisplayDate(e.date)}","${name}",${e.amount},"${notes}","${e.addedBy || ""}"\n`;
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `tithes_${curMonth + 1}_${curYear}.csv`;
    a.click();
  }

  return {
    curMonth,
    setCurMonth,
    curYear,
    setCurYear,
    years,
    search,
    setSearch,

    entries: filteredEntries,
    entryCount: entries.length,
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

    ...totals,
  };
}
