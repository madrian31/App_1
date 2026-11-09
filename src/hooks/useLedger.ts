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
import { toLocalISODate } from "../utils/date";

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
  // DONATION only — who gave it
  donorNonMember: boolean; // true = typed name (or blank for Anonymous) instead of a picked member
  donorMemberId: string;
  donorName: string;
}

export const EMPTY_LEDGER_FORM: LedgerEntryForm = {
  type: "EXPENSE",
  category: "",
  amount: "",
  description: "",
  dateAdded: toLocalISODate(new Date()),
  donorNonMember: false,
  donorMemberId: "",
  donorName: "",
};

/** Amount is required; a donation needs its giver (a picked member, or the non-member
 *  option), everything else needs a description. */
export function isLedgerFormComplete(form: LedgerEntryForm): boolean {
  if (!((parseFloat(form.amount) || 0) > 0)) return false;
  if (form.type === "DONATION") return form.donorNonMember || Boolean(form.donorMemberId);
  return form.description.trim().length > 0;
}

/** The form as a ledger entry. Donor fields are only kept for a donation. */
export function toNewLedgerEntry(
  form: LedgerEntryForm,
  department: LedgerDepartment,
  modifiedBy: string
): NewLedgerEntry {
  const isDonation = form.type === "DONATION";
  return {
    department,
    type: form.type,
    category: form.category.trim(),
    amount: parseFloat(form.amount) || 0,
    description: form.description.trim(),
    donorMemberId: isDonation && !form.donorNonMember ? form.donorMemberId : "",
    donorName: isDonation ? form.donorName.trim() || "Anonymous" : "",
    dateAdded: form.dateAdded,
    modifiedBy,
  };
}

function monthStartISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month, 1));
}
function monthEndISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month + 1, 0));
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
  const [form, setForm] = useState<LedgerEntryForm>(EMPTY_LEDGER_FORM);
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
    setForm({ ...EMPTY_LEDGER_FORM, dateAdded: toLocalISODate(new Date()) });
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
      donorNonMember: Boolean(entry.donorName) && !entry.donorMemberId,
      donorMemberId: entry.donorMemberId || "",
      donorName: entry.donorName === "Anonymous" && !entry.donorMemberId ? "" : entry.donorName || "",
    });
    setEditingId(entry.id);
    setShowForm(true);
  }

  function closeForm() {
    setForm(EMPTY_LEDGER_FORM);
    setEditingId(null);
    setShowForm(false);
  }

  function updateForm<K extends keyof LedgerEntryForm>(key: K, value: LedgerEntryForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canSave = isLedgerFormComplete(form);

  async function saveEntry() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = toNewLedgerEntry(form, department, currentUser);
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
    const totalDonations = entries.filter((e) => e.type === "DONATION").reduce((s, e) => s + e.amount, 0);
    return {
      totalExpenses,
      totalLoanOut,
      totalRepayment,
      totalDonations,
      netOutflow: totalExpenses + totalLoanOut - totalRepayment - totalDonations,
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
