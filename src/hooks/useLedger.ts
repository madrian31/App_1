import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getLedgerEntries,
  addLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
} from "../services/ledger/ledgerService";
import type {
  LedgerDepartment,
  LedgerEntry,
  LedgerEntryType,
  LedgerTotals,
  NewLedgerEntry,
} from "../types/ledger";

export const LEDGER_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export interface LedgerEntryForm {
  type: LedgerEntryType;
  category: string;
  amount: string;
  description: string;
  dateAdded: string; // ISO date
}

const EMPTY_FORM: LedgerEntryForm = {
  type: "EXPENSE",
  category: "",
  amount: "",
  description: "",
  dateAdded: new Date().toISOString().slice(0, 10),
};

function monthStartISO(year: number, month: number): string {
  return new Date(year, month, 1).toISOString().slice(0, 10);
}
function monthEndISO(year: number, month: number): string {
  return new Date(year, month + 1, 0).toISOString().slice(0, 10);
}

/**
 * Drives a single department's Ledger view: month/year filter, entry list,
 * add/edit form state, delete confirmation, and derived KPI totals.
 *
 * Usage: `useLedger("pledges", currentUserName)`
 */
export default function useLedger(department: LedgerDepartment, currentUser: string) {
  const now = new Date();

  const [curMonth, setCurMonth] = useState(now.getMonth());
  const [curYear, setCurYear] = useState(now.getFullYear());

  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LedgerEntryForm>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getLedgerEntries(
        department,
        monthStartISO(curYear, curMonth),
        monthEndISO(curYear, curMonth)
      );
      setEntries(list);
    } catch (err) {
      console.error("Failed to load ledger entries:", err);
      setError("Failed to load ledger entries.");
    } finally {
      setLoading(false);
    }
  }, [department, curMonth, curYear]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  function openAddForm() {
    setForm({ ...EMPTY_FORM, dateAdded: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(entry: LedgerEntry) {
    setForm({
      type: entry.type,
      category: entry.category,
      amount: String(entry.amount),
      description: entry.description,
      dateAdded: entry.dateAdded,
    });
    setEditingId(entry.id);
    setShowForm(true);
  }

  function closeForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function updateForm<K extends keyof LedgerEntryForm>(key: K, value: LedgerEntryForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canSave = Boolean(form.amount) && form.description.trim().length > 0;

  async function saveEntry() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload: NewLedgerEntry = {
        department,
        type: form.type,
        category: form.category.trim(),
        amount: parseFloat(form.amount) || 0,
        description: form.description.trim(),
        dateAdded: form.dateAdded,
        modifiedBy: currentUser,
      };
      if (editingId) {
        await updateLedgerEntry(editingId, payload);
      } else {
        await addLedgerEntry(payload);
      }
      closeForm();
      await refetch();
    } catch (err) {
      console.error("Failed to save ledger entry:", err);
      setError("Failed to save entry.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    try {
      await deleteLedgerEntry(id);
      setDeleteConfirmId(null);
      await refetch();
    } catch (err) {
      console.error("Failed to delete ledger entry:", err);
      setError("Failed to delete entry.");
    }
  }

  const totals = useMemo<LedgerTotals>(() => {
    const totalExpenses = entries.filter((e) => e.type === "EXPENSE").reduce((s, e) => s + e.amount, 0);
    const totalLoanOut = entries.filter((e) => e.type === "LOAN_OUT").reduce((s, e) => s + e.amount, 0);
    const totalRepayment = entries.filter((e) => e.type === "REPAYMENT").reduce((s, e) => s + e.amount, 0);
    return {
      totalExpenses,
      totalLoanOut,
      totalRepayment,
      netOutflow: totalExpenses + totalLoanOut - totalRepayment,
    };
  }, [entries]);

  return {
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

    ...totals,

    refetch,
  };
}
